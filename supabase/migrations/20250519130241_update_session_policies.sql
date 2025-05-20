-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."session_templates";
DROP POLICY IF EXISTS "Admins can manage instances of their own templates" ON "public"."session_instances";
DROP POLICY IF EXISTS "Authenticated users can view open session instances" ON "public"."session_instances";

-- Create updated policies for session_templates
CREATE POLICY "Users can view their own templates"
ON "public"."session_templates"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (created_by = auth.uid()::text);

CREATE POLICY "Users can view open templates"
ON "public"."session_templates"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_open = true);

-- Create updated policies for session_instances
CREATE POLICY "Users can manage instances of their own templates"
ON "public"."session_instances"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_templates
    WHERE session_templates.id = session_instances.template_id
    AND session_templates.created_by = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.session_templates
    WHERE session_templates.id = session_instances.template_id
    AND session_templates.created_by = auth.uid()::text
  )
);

CREATE POLICY "Users can view instances of open templates"
ON "public"."session_instances"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_templates
    WHERE session_templates.id = session_instances.template_id
    AND session_templates.is_open = true
  )
  AND status = 'scheduled'
  AND start_time > timezone('utc', now())
); 