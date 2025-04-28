import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Webhook } from 'https://esm.sh/svix@1.21.0'; // Clerk uses svix for webhooks
import { corsHeaders } from '../_shared/cors.ts'; // Optional: manage CORS if needed

// Define expected Clerk event payload structure (adjust based on actual usage)
interface ClerkUserEventData {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  first_name: string | null;
  last_name: string | null;
  // Add other fields you might need from the webhook payload
}

interface ClerkEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string; // Handle known types + others
  data: ClerkUserEventData | { id: string, deleted?: boolean }; // Data structure varies slightly
  object: 'event';
}

console.log('Clerk Webhook Handler Function Initializing');

Deno.serve(async (req) => {
  // --- 1. Check Method and Retrieve Secrets ---
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders }); // Handle CORS preflight
  }
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return new Response('Method Not Allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SIGNING_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const defaultOrgId = Deno.env.get('DEFAULT_ORGANIZATION_ID');

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    return new Response('Internal Server Error: Missing configuration', { status: 500 });
  }

  // --- 2. Initialize Supabase Admin Client ---
  // Important: Use the Service Role Key for admin privileges
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      // Required for service_role key. Make sure your function runs with appropriate permissions.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('Supabase admin client initialized');

  // --- 3. Verify Webhook Signature ---
  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return new Response('Webhook Error: Missing svix headers', { status: 400 });
  }

  const body = await req.text(); // Read body as text for verification
  let event: ClerkEvent;
  const wh = new Webhook(webhookSecret);

  try {
    // Verify signature and parse
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkEvent; // Type assertion after verification
    console.log('Webhook verified successfully. Event type:', event.type);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // --- 4. Process Verified Event ---
  try {
    switch (event.type) {
      case 'user.created': {
        console.log('Processing user.created event for Clerk ID:', event.data.id);
        const userData = event.data as ClerkUserEventData;
        const primaryEmail = userData.email_addresses?.[0]?.email_address;
    
        // --- Read the Default Org ID ---
        // Do this *before* the insert statement
        const defaultOrgIdFromEnv = Deno.env.get('DEFAULT_ORGANIZATION_ID');
        if (!defaultOrgIdFromEnv) {
             console.error('CRITICAL: DEFAULT_ORGANIZATION_ID environment variable is not set!');
             // You might want to return an error here to prevent user creation without an org
             return new Response('Server Configuration Error: Default organization not set', { status: 500 });
        }
        // --- End Reading Default Org ID ---
    
    
        if (!primaryEmail) {
           console.error('User created event missing primary email for Clerk ID:', userData.id);
           return new Response('Webhook Error: User created without primary email', { status: 400 });
        }
    
        // Check if user already exists (idempotency)
        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('clerk_user_id', userData.id)
          .maybeSingle();
    
        if (checkError) {
           console.error('Error checking for existing user:', checkError);
           throw checkError;
        }
    
        if (existingUser) {
          console.log('User already exists in DB, skipping creation for Clerk ID:', userData.id);
          break;
        }
    
        // === MODIFIED INSERT STATEMENT ===
        console.log(`Assigning default organization ID: ${defaultOrgIdFromEnv} to new user ${userData.id}`);
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
             // id: userData.id, // Uncomment if your users.id PK IS the clerk_user_id
             clerk_user_id: userData.id,
             email: primaryEmail,
             first_name: userData.first_name,
             last_name: userData.last_name,
             organization_id: defaultOrgIdFromEnv // <-- ADD THIS LINE
          });
        // === END MODIFIED INSERT ===
    
        if (insertError) {
          console.error('Error inserting user:', insertError);
          throw insertError;
        }
        console.log('Successfully inserted user for Clerk ID:', userData.id, 'with default organization.');
        break;
      } // End case 'user.created'

      case 'user.updated': {
        console.log('Processing user.updated event for Clerk ID:', event.data.id);
        const userData = event.data as ClerkUserEventData; // Cast to expected structure
        const primaryEmail = userData.email_addresses?.[0]?.email_address;

         if (!primaryEmail) {
           console.warn('User updated event missing primary email for Clerk ID:', userData.id, '- Skipping email update.');
           // If email is critical, you might return an error instead.
         }

        const updateData: { email?: string; first_name?: string | null; last_name?: string | null; updated_at: string } = {
          updated_at: new Date().toISOString() // Always update the timestamp
        };
        if (primaryEmail) updateData.email = primaryEmail;
        // Only include name fields if they are present in the payload
        // (check if Clerk sends nulls explicitly or omits fields)
        if (userData.hasOwnProperty('first_name')) updateData.first_name = userData.first_name;
        if (userData.hasOwnProperty('last_name')) updateData.last_name = userData.last_name;


        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('clerk_user_id', userData.id); // Match using clerk_user_id

        if (updateError) {
          console.error('Error updating user:', updateError);
          // Don't throw if user not found (e.g., maybe deleted before update processed)
          if (updateError.code !== 'PGRST116') { // PGRST116: JSON object requested, multiple (or no) rows returned
             throw updateError;
          } else {
             console.warn('User not found for update (Clerk ID:', userData.id, '), possibly already deleted.');
          }
        } else {
            console.log('Successfully updated user for Clerk ID:', userData.id);
        }
        break;
      }

      case 'user.deleted': {
        const userData = event.data as { id: string; deleted?: boolean }; // Simpler structure for delete
        console.log('Processing user.deleted event for Clerk ID:', userData.id);

        // --- !! WARNING: HARD DELETE !! ---
        // This will FAIL if the user has related records in tables with
        // ON DELETE RESTRICT constraints (bookings, memberships etc).
        // Consider a soft delete (setting an `is_active` flag or `deleted_at` timestamp)
        // on the `users` table instead, which requires schema changes.
        const { error: deleteError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('clerk_user_id', userData.id); // Match using clerk_user_id

        if (deleteError) {
            // Log specific constraint violation errors differently
            if (deleteError.code === '23503') { // foreign_key_violation
                 console.error(`Cannot delete user (Clerk ID: ${userData.id}) due to existing related records (foreign key violation). Consider soft delete. Error: ${deleteError.message}`);
                 // Return 200 OK here? Or 409 Conflict? Let's return 409
                 return new Response('Conflict: User cannot be deleted due to existing references', { status: 409 });
            } else if (deleteError.code !== 'PGRST116') { // Ignore 'user not found'
              console.error('Error deleting user:', deleteError);
              throw deleteError;
            } else {
                 console.warn('User not found for deletion (Clerk ID:', userData.id, '), possibly already deleted.');
            }

        } else {
             console.log('Successfully deleted user for Clerk ID:', userData.id);
        }
        // --- End Hard Delete Warning ---

        // --- Example: Soft Delete (Requires `deleted_at` timestamp column) ---
        /*
        const { error: softDeleteError } = await supabaseAdmin
           .from('users')
           .update({ deleted_at: new Date().toISOString() })
           .eq('clerk_user_id', userData.id);

         if (softDeleteError && softDeleteError.code !== 'PGRST116') {
            console.error('Error soft-deleting user:', softDeleteError);
            throw softDeleteError;
         } else if (!softDeleteError) {
            console.log('Successfully soft-deleted user for Clerk ID:', userData.id);
         } else {
            console.warn('User not found for soft deletion (Clerk ID:', userData.id, '), possibly already deleted.');
         }
        */
        // --- End Soft Delete Example ---

        break;
      }

      default:
        console.log('Received unhandled event type:', event.type);
        // Optionally handle other event types if needed
    }

    // --- 5. Return Success ---
    console.log('Webhook processed successfully for event type:', event.type);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // --- 6. Handle Errors During Processing ---
    console.error('Error processing webhook event:', error);
    return new Response(`Webhook Processing Error: ${error.message}`, {
      status: 500, // Use 500 for server-side processing errors
      headers: { ...corsHeaders },
     });
  }
});

// Optional: Define CORS headers if calling from browser or different origin needed
// Usually webhooks are server-to-server, but OPTIONS might be needed.
// supabase/functions/_shared/cors.ts
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or specific origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
*/