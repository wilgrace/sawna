-- Drop dependencies first
DROP INDEX IF EXISTS idx_session_instances_clerk_user_id;
DROP INDEX IF EXISTS idx_session_instances_new_clerk_user_id;

-- Drop RLS policies that depend on clerk_user_id
DROP POLICY IF EXISTS "Users can manage their own session instances" ON session_instances;

-- Add clerk_user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_instances' 
        AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE session_instances
        ADD COLUMN clerk_user_id text;
    END IF;
END $$;

-- Create index on clerk_user_id
CREATE INDEX IF NOT EXISTS idx_session_instances_clerk_user_id
ON session_instances(clerk_user_id);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own session instances" ON session_instances;

-- Add RLS policy
CREATE POLICY "Users can manage their own session instances"
ON session_instances
FOR ALL
TO authenticated
USING (clerk_user_id = auth.uid()::text);

-- Make clerk_user_id nullable
ALTER TABLE session_instances
ALTER COLUMN clerk_user_id DROP NOT NULL; 