-- Add organization_id column to session_templates
ALTER TABLE "public"."session_templates" 
ADD COLUMN "organization_id" uuid REFERENCES "public"."organizations"("id") ON DELETE SET NULL;

-- Add index for organization_id
CREATE INDEX idx_session_templates_organization_id ON public.session_templates USING btree (organization_id); 