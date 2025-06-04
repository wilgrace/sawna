import { createClient } from '@supabase/supabase-js';
import * as schema from './schema';

// These should come from your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export the schema for type safety
export { schema }; 