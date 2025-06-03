-- Enable RLS for session_templates
ALTER TABLE "public"."session_templates" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to read session_templates
CREATE POLICY "Allow authenticated users to read session_templates"
ON "public"."session_templates"
FOR SELECT
TO authenticated
USING (true);

-- Add missing organization_id column to bookings table
ALTER TABLE "public"."bookings" ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "public"."organizations"("id");

-- Enable RLS for bookings
ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to manage their own bookings
CREATE POLICY "Allow authenticated users to manage their own bookings"
ON "public"."bookings"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "public"."clerk_users" cu
    WHERE cu.id = bookings.user_id
    AND cu.clerk_user_id = auth.uid()::text
  )
); 