-- First, create a default organization if it doesn't exist
INSERT INTO public.organizations (id, name)
SELECT gen_random_uuid(), 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Default Organization');

-- Get the default organization ID
DO $$
DECLARE
    default_org_id text;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE name = 'Default Organization';
    
    -- Update existing clerk_users to use the default organization
    UPDATE public.clerk_users
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    -- Make organization_id NOT NULL
    ALTER TABLE public.clerk_users
    ALTER COLUMN organization_id SET NOT NULL;
END $$; 