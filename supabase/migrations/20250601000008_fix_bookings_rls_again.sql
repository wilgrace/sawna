-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Debug: Allow viewing all bookings" ON bookings;
DROP POLICY IF EXISTS "Debug: Allow all operations" ON bookings;

-- Create debug function to log RLS checks
CREATE OR REPLACE FUNCTION log_rls_check()
RETURNS TRIGGER AS $$
DECLARE
  auth_uid text;
  clerk_user_id text;
BEGIN
  auth_uid := auth.uid()::text;
  SELECT cu.clerk_user_id INTO clerk_user_id 
  FROM clerk_users cu 
  WHERE cu.id = NEW.user_id;
  
  RAISE NOTICE 'RLS Debug - Auth UID: %, Clerk User ID: %, Match: %',
    auth_uid,
    clerk_user_id,
    auth_uid = clerk_user_id;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for RLS logging
DROP TRIGGER IF EXISTS log_rls_check_trigger ON bookings;
CREATE TRIGGER log_rls_check_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_rls_check();

-- Create new policies that use EXISTS for better performance
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clerk_users
      WHERE clerk_users.id = bookings.user_id
      AND clerk_users.clerk_user_id = auth.uid()::text
    )
  );

-- Add a debug policy that allows viewing all bookings (temporary)
CREATE POLICY "Debug: Allow viewing all bookings" ON bookings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own bookings" ON bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clerk_users
      WHERE clerk_users.id = bookings.user_id
      AND clerk_users.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clerk_users
      WHERE clerk_users.id = bookings.user_id
      AND clerk_users.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own bookings" ON bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clerk_users
      WHERE clerk_users.id = bookings.user_id
      AND clerk_users.clerk_user_id = auth.uid()::text
    )
  ); 