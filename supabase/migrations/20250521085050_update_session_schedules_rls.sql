-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own session schedules" ON public.session_schedules;

-- Create new policy for authenticated users
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