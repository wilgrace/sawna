-- Function to update the updated_at column on row update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure clerk user exists
CREATE OR REPLACE FUNCTION public.ensure_clerk_user(
  p_clerk_user_id text,
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_default_org_id text;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id
  FROM public.clerk_users
  WHERE clerk_user_id = p_clerk_user_id;

  -- If user doesn't exist, create them
  IF v_user_id IS NULL THEN
    -- Get the default organization ID
    SELECT id INTO v_default_org_id
    FROM public.organizations
    WHERE name = 'Default Organization';

    -- If no default organization exists, create one
    IF v_default_org_id IS NULL THEN
      INSERT INTO public.organizations (id, name)
      VALUES ('org_default', 'Default Organization')
      RETURNING id INTO v_default_org_id;
    END IF;

    -- Create the user
    INSERT INTO public.clerk_users (
      clerk_user_id,
      email,
      first_name,
      last_name,
      organization_id
    )
    VALUES (
      p_clerk_user_id,
      p_email,
      p_first_name,
      p_last_name,
      v_default_org_id
    )
    RETURNING id INTO v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

-- Create organizations table with text IDs
CREATE TABLE IF NOT EXISTS public.organizations (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    logo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create clerk_users table
CREATE TABLE IF NOT EXISTS public.clerk_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id text,
    is_super_admin boolean NOT NULL DEFAULT false,
    email text NOT NULL,
    first_name text,
    last_name text,
    date_of_birth date,
    gender text,
    ethnicity text,
    home_postal_code text,
    clerk_user_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT clerk_users_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Create session_templates table
CREATE TABLE IF NOT EXISTS public.session_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id text,
    name text NOT NULL,
    description text,
    capacity integer NOT NULL,
    duration_minutes integer NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    one_off_start_time timestamptz,
    one_off_date date,
    recurrence_start_date date,
    recurrence_end_date date,
    created_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_templates_pkey PRIMARY KEY (id),
    CONSTRAINT session_templates_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.clerk_users(id) ON DELETE CASCADE,
    CONSTRAINT session_templates_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Create session_instances table
CREATE TABLE IF NOT EXISTS public.session_instances (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id text,
    template_id uuid NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_instances_pkey PRIMARY KEY (id),
    CONSTRAINT session_instances_template_id_fkey FOREIGN KEY (template_id)
        REFERENCES public.session_templates(id) ON DELETE CASCADE,
    CONSTRAINT session_instances_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id text,
    session_instance_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'confirmed',
    number_of_spots integer NOT NULL DEFAULT 1,
    notes text,
    booked_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bookings_pkey PRIMARY KEY (id),
    CONSTRAINT bookings_session_instance_id_fkey FOREIGN KEY (session_instance_id)
        REFERENCES public.session_instances(id) ON DELETE CASCADE,
    CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.clerk_users(id) ON DELETE CASCADE,
    CONSTRAINT bookings_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id) ON DELETE SET NULL,
    CONSTRAINT valid_status CHECK (status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text, 'no_show'::text]))
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS bookings_session_instance_id_user_id_key 
    ON public.bookings USING btree (session_instance_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_instance_id 
    ON public.bookings USING btree (session_instance_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id 
    ON public.bookings USING btree (user_id);

-- Create a function to handle organization changes
CREATE OR REPLACE FUNCTION public.handle_organization_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the existing clerk-webhook-handler Edge Function
  PERFORM net.http_post(
    url := 'http://localhost:54321/functions/v1/clerk-webhook-handler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'svix-id', gen_random_uuid()::text,
      'svix-timestamp', extract(epoch from now())::text,
      'svix-signature', 'test-signature' -- This will be treated as a test event
    ),
    body := jsonb_build_object(
      'type', 'organization.updated',
      'data', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.name,
        'slug', NEW.id,
        'created_at', extract(epoch from NEW.created_at)::bigint,
        'updated_at', extract(epoch from NEW.updated_at)::bigint,
        'created_by', 'system',
        'public_metadata', jsonb_build_object(
          'description', NEW.description,
          'logo_url', NEW.logo_url
        ),
        'private_metadata', '{}'::jsonb
      ),
      'object', 'event',
      'timestamp', extract(epoch from now())::bigint
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_organization_change ON public.organizations;
CREATE TRIGGER on_organization_change
  AFTER INSERT OR UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_organization_change();

CREATE TRIGGER on_bookings_update 
  BEFORE UPDATE ON public.bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can read their own organizations" ON public.organizations;
CREATE POLICY "Users can read their own organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_users
    WHERE clerk_users.organization_id = organizations.id
    AND clerk_users.clerk_user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;
CREATE POLICY "Super admins can manage all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clerk_users
    WHERE clerk_users.clerk_user_id = auth.uid()::text
    AND clerk_users.is_super_admin = true
  )
);

DROP POLICY IF EXISTS "Admins can delete bookings for their session instances" ON public.bookings;
CREATE POLICY "Admins can delete bookings for their session instances"
ON public.bookings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM session_instances
    JOIN session_templates ON session_templates.id = session_instances.template_id
    WHERE session_instances.id = bookings.session_instance_id
    AND session_templates.created_by IN (
      SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Admins can manage instances of their own templates"
ON public.session_instances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM session_templates
    WHERE session_templates.id = session_instances.template_id
    AND session_templates.created_by IN (
      SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "Enable insert for authenticated users"
ON public.session_templates
FOR INSERT
TO authenticated
WITH CHECK (
  created_by IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Enable update for users based on created_by"
ON public.session_templates
FOR UPDATE
TO authenticated
USING (
  created_by IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
)
WITH CHECK (
  created_by IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

-- Add default organization if it doesn't exist
INSERT INTO public.organizations (id, name, description)
VALUES ('org_default', 'Default Organization', 'Default organization for new users')
ON CONFLICT (id) DO NOTHING; 