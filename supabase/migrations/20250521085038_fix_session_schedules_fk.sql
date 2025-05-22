-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.session_schedules
DROP CONSTRAINT IF EXISTS session_schedules_session_template_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.session_schedules
ADD CONSTRAINT session_schedules_session_template_id_fkey
FOREIGN KEY (session_template_id) 
REFERENCES public.session_templates(id) 
ON DELETE CASCADE;

-- Create an index on the foreign key column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_session_schedules_template_id 
ON public.session_schedules(session_template_id); 