-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own session schedules" ON public.session_schedules;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own session schedules"
ON public.session_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_templates st
    JOIN public.clerk_users cu ON st.created_by = cu.id
    WHERE st.id = session_schedules.session_template_id
    AND cu.clerk_user_id = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.session_templates st
    JOIN public.clerk_users cu ON st.created_by = cu.id
    WHERE st.id = session_schedules.session_template_id
    AND cu.clerk_user_id = auth.uid()::text
  )
); 