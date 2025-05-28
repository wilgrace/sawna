-- Create session_instances table
CREATE TABLE IF NOT EXISTS public.session_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id uuid NOT NULL REFERENCES public.session_templates(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_instances_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_instances_template_id
ON public.session_instances(template_id);

CREATE INDEX IF NOT EXISTS idx_session_instances_start_time
ON public.session_instances(start_time);

CREATE INDEX IF NOT EXISTS idx_session_instances_status
ON public.session_instances(status);

-- Add RLS policies
ALTER TABLE public.session_instances ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Enable read access for authenticated users"
ON public.session_instances
FOR SELECT
TO authenticated
USING (true);

-- Allow insert/update/delete only for template owners
CREATE POLICY "Enable insert for template owners"
ON public.session_instances
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.session_templates st
        JOIN public.clerk_users cu ON st.created_by::text = cu.clerk_user_id
        WHERE st.id = template_id
        AND cu.clerk_user_id = auth.uid()::text
    )
);

CREATE POLICY "Enable update for template owners"
ON public.session_instances
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_templates st
        JOIN public.clerk_users cu ON st.created_by::text = cu.clerk_user_id
        WHERE st.id = template_id
        AND cu.clerk_user_id = auth.uid()::text
    )
);

CREATE POLICY "Enable delete for template owners"
ON public.session_instances
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.session_templates st
        JOIN public.clerk_users cu ON st.created_by::text = cu.clerk_user_id
        WHERE st.id = template_id
        AND cu.clerk_user_id = auth.uid()::text
    )
);

-- Create a new table with the correct structure
CREATE TABLE IF NOT EXISTS public.session_instances_new (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    clerk_user_id text NOT NULL,
    CONSTRAINT session_instances_new_pkey PRIMARY KEY (id),
    CONSTRAINT session_instances_new_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.session_templates(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
WITH template_owners AS (
    SELECT 
        st.id as template_id,
        cu.clerk_user_id
    FROM public.session_templates st
    JOIN public.clerk_users cu ON st.created_by::text = cu.clerk_user_id
)
INSERT INTO public.session_instances_new (
    id,
    template_id,
    start_time,
    end_time,
    status,
    created_at,
    updated_at,
    clerk_user_id
)
SELECT 
    si.id,
    si.template_id,
    si.start_time,
    si.end_time,
    si.status,
    si.created_at,
    si.updated_at,
    owners.clerk_user_id
FROM public.session_instances si
JOIN template_owners owners ON si.template_id = owners.template_id;

-- Create indexes on new table
CREATE INDEX IF NOT EXISTS idx_session_instances_new_template_id
ON public.session_instances_new(template_id);

CREATE INDEX IF NOT EXISTS idx_session_instances_new_start_time
ON public.session_instances_new(start_time);

CREATE INDEX IF NOT EXISTS idx_session_instances_new_status
ON public.session_instances_new(status);

-- Enable RLS on new table
ALTER TABLE public.session_instances_new ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own session instances"
ON public.session_instances_new
FOR ALL
TO authenticated
USING (clerk_user_id = auth.uid()::text);

-- Add trigger for updated_at
CREATE TRIGGER on_session_instances_new_update
    BEFORE UPDATE ON public.session_instances_new
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Drop old table and rename new table
DROP TABLE IF EXISTS public.session_instances;
ALTER TABLE public.session_instances_new RENAME TO session_instances; 