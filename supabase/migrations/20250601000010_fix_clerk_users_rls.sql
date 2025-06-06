-- Enable RLS for clerk_users if not already enabled
ALTER TABLE public.clerk_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own clerk user record" ON public.clerk_users;
DROP POLICY IF EXISTS "Super admins can manage all clerk users" ON public.clerk_users;
DROP POLICY IF EXISTS "Organization admins can manage their organization's clerk users" ON public.clerk_users;

-- Create policy for users to read their own record
CREATE POLICY "Users can read their own clerk user record"
ON public.clerk_users
FOR SELECT
TO authenticated
USING (clerk_user_id = auth.uid()::text);

-- Create policy for super admins
CREATE POLICY "Super admins can manage all clerk users"
ON public.clerk_users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:super_admin'
);

-- Create policy for organization admins
CREATE POLICY "Organization admins can manage their organization's clerk users"
ON public.clerk_users
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:admin'
  AND organization_id = auth.jwt() ->> 'org_id'
); 