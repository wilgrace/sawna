-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    logo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add default organization
INSERT INTO organizations (id, name, description)
VALUES ('org_default', 'Default Organization', 'Default organization for new users')
ON CONFLICT (id) DO NOTHING; 