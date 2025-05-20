-- Drop all policies that reference created_by
DO $$ 
DECLARE
    policy_name text;
BEGIN
    -- Drop policies on session_templates table
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'session_templates' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.session_templates', policy_name);
    END LOOP;

    -- Drop policies on session_instances table
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'session_instances' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.session_instances', policy_name);
    END LOOP;

    -- Drop policies on bookings table
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.bookings', policy_name);
    END LOOP;
END $$;

-- Drop the foreign key constraint
ALTER TABLE "public"."session_templates" 
DROP CONSTRAINT IF EXISTS "session_templates_created_by_fkey";

-- Disable RLS temporarily
ALTER TABLE "public"."session_templates" DISABLE ROW LEVEL SECURITY;

-- Change the column type to TEXT
ALTER TABLE "public"."session_templates" 
ALTER COLUMN "created_by" TYPE TEXT USING "created_by"::TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN "public"."session_templates"."created_by" IS 'Stores the Clerk User ID string directly';

-- Re-enable RLS
ALTER TABLE "public"."session_templates" ENABLE ROW LEVEL SECURITY;

-- Recreate the policies
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

-- Recreate the policy on bookings table
CREATE POLICY "Admins can delete bookings for their session instances"
ON public.bookings
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_instances
    JOIN public.session_templates ON session_templates.id = session_instances.template_id
    WHERE session_instances.id = bookings.session_instance_id
    AND session_templates.created_by = auth.uid()::text
  )
);

-- Recreate the policy on session_instances table
CREATE POLICY "Admins can manage instances of their own templates"
ON public.session_instances
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_templates
    WHERE session_templates.id = session_instances.template_id
    AND session_templates.created_by = auth.uid()::text
  )
); 