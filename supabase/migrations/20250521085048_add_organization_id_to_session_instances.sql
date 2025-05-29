-- Add organization_id column to session_instances if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'session_instances' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE session_instances
        ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
        
        -- Add index for organization_id
        CREATE INDEX idx_session_instances_organization_id 
        ON session_instances(organization_id);
        
        -- Update existing instances with organization_id from their templates
        UPDATE session_instances si
        SET organization_id = st.organization_id
        FROM session_templates st
        WHERE si.template_id = st.id;
    END IF;
END $$; 