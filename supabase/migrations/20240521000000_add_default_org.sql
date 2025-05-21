-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add default organization
INSERT INTO organizations (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Organization', 'Default organization for new users')
ON CONFLICT (id) DO NOTHING; 