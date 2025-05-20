-- First, drop the foreign key constraint
ALTER TABLE "public"."session_templates" DROP CONSTRAINT IF EXISTS "session_templates_created_by_fkey";

-- Change the column type from UUID to TEXT
ALTER TABLE "public"."session_templates" 
ALTER COLUMN "created_by" TYPE TEXT USING "created_by"::TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN "public"."session_templates"."created_by" IS 'Stores the Clerk User ID string directly';

-- Update RLS policies if needed
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."session_templates";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."session_templates";
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON "public"."session_templates";

-- Add updated RLS policies
CREATE POLICY "Enable read access for authenticated users"
ON "public"."session_templates"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON "public"."session_templates"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Enable update for users based on created_by"
ON "public"."session_templates"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (created_by = auth.uid()::text)
WITH CHECK (created_by = auth.uid()::text); 