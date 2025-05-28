-- Drop dependencies first
DROP INDEX IF EXISTS idx_session_instances_clerk_user_id;
DROP INDEX IF EXISTS idx_session_instances_new_clerk_user_id;

-- Drop RLS policies that depend on clerk_user_id
DROP POLICY IF EXISTS "Users can manage their own session instances" ON session_instances;

-- Drop clerk_user_id column from session_instances table
ALTER TABLE session_instances
DROP COLUMN clerk_user_id; 