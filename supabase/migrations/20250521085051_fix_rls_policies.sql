-- Drop existing policies for session_instances
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.session_instances;
DROP POLICY IF EXISTS "Enable insert for template owners" ON public.session_instances;
DROP POLICY IF EXISTS "Enable update for template owners" ON public.session_instances;
DROP POLICY IF EXISTS "Enable delete for template owners" ON public.session_instances;
DROP POLICY IF EXISTS "Users can manage their own session instances" ON public.session_instances;

-- Create new policy for session_instances
CREATE POLICY "Users can manage their own session instances"
ON public.session_instances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_templates st
    WHERE st.id = session_instances.template_id
    AND st.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.session_templates st
    WHERE st.id = session_instances.template_id
    AND st.created_by = auth.uid()
  )
);

-- Drop existing policies for session_schedules
DROP POLICY IF EXISTS "Users can manage their own session schedules" ON public.session_schedules;

-- Create new policy for session_schedules
CREATE POLICY "Users can manage their own session schedules"
ON public.session_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_templates st
    WHERE st.id = session_schedules.session_template_id
    AND st.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.session_templates st
    WHERE st.id = session_schedules.session_template_id
    AND st.created_by = auth.uid()
  )
); 