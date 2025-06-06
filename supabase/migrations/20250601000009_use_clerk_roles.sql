-- Add organization_id to session_schedules
ALTER TABLE session_schedules ADD COLUMN IF NOT EXISTS organization_id text REFERENCES organizations(id);

-- Drop existing super admin policies
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Super admins can manage all session instances" ON session_instances;
DROP POLICY IF EXISTS "Super admins can manage all session templates" ON session_templates;
DROP POLICY IF EXISTS "Super admins can manage all session schedules" ON session_schedules;

-- Create new policies using Clerk roles
CREATE POLICY "Super admins can manage all organizations"
ON organizations
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:super_admin'
);

CREATE POLICY "Super admins can manage all bookings"
ON bookings
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:super_admin'
);

CREATE POLICY "Super admins can manage all session instances"
ON session_instances
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:super_admin'
);

CREATE POLICY "Super admins can manage all session templates"
ON session_templates
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:super_admin'
);

CREATE POLICY "Super admins can manage all session schedules"
ON session_schedules
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:super_admin'
);

-- Add organization admin policies
CREATE POLICY "Organization admins can manage their organization"
ON organizations
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:admin'
  AND id = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Organization admins can manage their organization's bookings"
ON bookings
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:admin'
  AND organization_id = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Organization admins can manage their organization's session instances"
ON session_instances
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:admin'
  AND organization_id = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Organization admins can manage their organization's session templates"
ON session_templates
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:admin'
  AND organization_id = auth.jwt() ->> 'org_id'
);

CREATE POLICY "Organization admins can manage their organization's session schedules"
ON session_schedules
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'org_role' = 'org:admin'
  AND organization_id = auth.jwt() ->> 'org_id'
); 