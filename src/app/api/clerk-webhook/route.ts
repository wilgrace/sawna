import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ClerkUserEventData {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  first_name: string | null;
  last_name: string | null;
}

interface ClerkEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string;
  data: ClerkUserEventData | { id: string, deleted?: boolean };
  object: 'event';
}

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const defaultOrgId = process.env.DEFAULT_ORGANIZATION_ID;

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    return new NextResponse('Internal Server Error: Missing configuration', { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const svix_id = req.headers.get('svix-id');
  const svix_timestamp = req.headers.get('svix-timestamp');
  const svix_signature = req.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Webhook Error: Missing svix headers', { status: 400 });
  }

  const body = await req.text();
  let event: ClerkEvent;
  const wh = new Webhook(webhookSecret);

  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkEvent;
  } catch (err: unknown) {
    const error = err as Error;
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'user.created': {
        const userData = event.data as ClerkUserEventData;
        const primaryEmail = userData.email_addresses?.[0]?.email_address;
        const defaultOrgIdFromEnv = process.env.DEFAULT_ORGANIZATION_ID;

        if (!defaultOrgIdFromEnv) {
          return new NextResponse('Server Configuration Error: Default organization not set', { status: 500 });
        }

        if (!primaryEmail) {
          return new NextResponse('Webhook Error: User created without primary email', { status: 400 });
        }

        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('clerk_user_id', userData.id)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) break;

        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_user_id: userData.id,
            email: primaryEmail,
            first_name: userData.first_name,
            last_name: userData.last_name,
            organization_id: defaultOrgIdFromEnv
          });

        if (insertError) throw insertError;
        break;
      }

      case 'user.updated': {
        const userData = event.data as ClerkUserEventData;
        const primaryEmail = userData.email_addresses?.[0]?.email_address;

        const updateData: { email?: string; first_name?: string | null; last_name?: string | null; updated_at: string } = {
          updated_at: new Date().toISOString()
        };
        if (primaryEmail) updateData.email = primaryEmail;
        if (userData.hasOwnProperty('first_name')) updateData.first_name = userData.first_name;
        if (userData.hasOwnProperty('last_name')) updateData.last_name = userData.last_name;

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('clerk_user_id', userData.id);

        if (updateError && updateError.code !== 'PGRST116') throw updateError;
        break;
      }

      case 'user.deleted': {
        const userData = event.data as { id: string; deleted?: boolean };
        const { error: deleteError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('clerk_user_id', userData.id);

        if (deleteError && deleteError.code !== 'PGRST116') {
          if (deleteError.code === '23503') {
            return new NextResponse('Conflict: User cannot be deleted due to existing references', { status: 409 });
          }
          throw deleteError;
        }
        break;
      }
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new NextResponse(`Webhook Processing Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
} 