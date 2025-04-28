import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const createSupabaseClient = (customHeaders?: Record<string, string>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: customHeaders,
    },
  });
};

// Client for server-side operations
export const createSupabaseServerClient = (authToken?: string) => {
  const headers: Record<string, string> = {};
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return createSupabaseClient(headers);
};

// Admin client with service role (use carefully, only on server)
export const createSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
};