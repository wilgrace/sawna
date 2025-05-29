-- Add clerk_user_id column
ALTER TABLE public.session_instances
ADD COLUMN clerk_user_id text;

-- Update clerk_user_id based on template ownership
WITH template_owners AS (
    SELECT 
        st.id as template_id,
        cu.clerk_user_id
    FROM public.session_templates st
    JOIN public.clerk_users cu ON st.created_by::text = cu.clerk_user_id
)
UPDATE public.session_instances si
SET clerk_user_id = owners.clerk_user_id
FROM template_owners owners
WHERE si.template_id = owners.template_id;

-- Make clerk_user_id NOT NULL after data migration
ALTER TABLE public.session_instances
ALTER COLUMN clerk_user_id SET NOT NULL;

-- Create index on clerk_user_id
CREATE INDEX IF NOT EXISTS idx_session_instances_clerk_user_id
ON public.session_instances(clerk_user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.session_instances;
DROP POLICY IF EXISTS "Enable insert for template owners" ON public.session_instances;
DROP POLICY IF EXISTS "Enable update for template owners" ON public.session_instances;
DROP POLICY IF EXISTS "Enable delete for template owners" ON public.session_instances;

-- Create new policy for authenticated users
CREATE POLICY "Users can manage their own session instances"
ON public.session_instances
FOR ALL
TO authenticated
USING (clerk_user_id = auth.uid()::text); 