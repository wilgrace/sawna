-- Add organization_id column to session_instances
ALTER TABLE "public"."session_instances" 
ADD COLUMN "organization_id" uuid REFERENCES "public"."organizations"("id") ON DELETE SET NULL;

-- Add index for organization_id
CREATE INDEX idx_session_instances_organization_id ON public.session_instances USING btree (organization_id);

-- Update existing instances with organization_id from their templates
UPDATE public.session_instances si
SET organization_id = st.organization_id
FROM public.session_templates st
WHERE si.template_id = st.id; 