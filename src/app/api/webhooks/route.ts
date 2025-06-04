import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

// Disable authentication and caching
export const dynamic = 'force-dynamic';
// Remove edge runtime
// export const runtime = 'edge';

export async function POST(req: Request) {
  console.log('Webhook received');
  
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers');
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type;
  if (eventType === 'user.created') {
    const { id, email_addresses, ...attributes } = evt.data;
    console.log('User created:', { id, email_addresses, ...attributes });

    try {
      const defaultOrgId = process.env.DEFAULT_ORGANIZATION_ID;
      if (!defaultOrgId) {
        throw new Error('DEFAULT_ORGANIZATION_ID environment variable is not set');
      }

      const userData = {
        clerk_user_id: id,
        email: email_addresses[0]?.email_address || '',
        first_name: attributes.first_name || '',
        last_name: attributes.last_name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_id: defaultOrgId
      };
      
      console.log('Attempting to insert user:', userData);
      
      // Add user to local database using Supabase
      const { data, error } = await supabase
        .from('clerk_users')
        .insert(userData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Insert result:', data);
      console.log('User added to local database successfully');
    } catch (error) {
      console.error('Error adding user to local database:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return new Response('Error adding user to database', {
        status: 500
      });
    }
  }

  return NextResponse.json({ success: true });
} 