-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.session_instances
DROP CONSTRAINT IF EXISTS session_instances_template_id_fkey;

-- Add the foreign key constraint
ALTER TABLE public.session_instances
ADD CONSTRAINT session_instances_template_id_fkey
FOREIGN KEY (template_id) 
REFERENCES public.session_templates(id) 
ON DELETE CASCADE;

-- Create an index on the foreign key column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_session_instances_template_id 
ON public.session_instances(template_id); 