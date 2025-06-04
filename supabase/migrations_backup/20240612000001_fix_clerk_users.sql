-- Drop the table if it exists to ensure clean state
DROP TABLE IF EXISTS clerk_users;

-- Recreate the table with the correct structure
CREATE TABLE clerk_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add RLS policies
ALTER TABLE clerk_users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view their own data" ON clerk_users
    FOR SELECT
    USING (auth.uid()::text = clerk_user_id);

-- Allow service role to manage all records
CREATE POLICY "Service role can manage all records" ON clerk_users
    USING (auth.role() = 'service_role'); 