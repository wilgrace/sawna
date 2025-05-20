-- Drop existing foreign keys if they exist
ALTER TABLE IF EXISTS session_schedules 
  DROP CONSTRAINT IF EXISTS session_schedules_session_template_id_fkey;

ALTER TABLE IF EXISTS session_instances 
  DROP CONSTRAINT IF EXISTS session_instances_template_id_fkey;

-- Add foreign key for session_schedules
ALTER TABLE session_schedules
  ADD CONSTRAINT session_schedules_session_template_id_fkey
  FOREIGN KEY (session_template_id)
  REFERENCES session_templates(id)
  ON DELETE CASCADE;

-- Add foreign key for session_instances
ALTER TABLE session_instances
  ADD CONSTRAINT session_instances_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES session_templates(id)
  ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_session_schedules_template_id 
  ON session_schedules(session_template_id);

CREATE INDEX IF NOT EXISTS idx_session_instances_template_id 
  ON session_instances(template_id);

-- Add comments for documentation
COMMENT ON CONSTRAINT session_schedules_session_template_id_fkey ON session_schedules 
  IS 'Foreign key linking session_schedules to session_templates';

COMMENT ON CONSTRAINT session_instances_template_id_fkey ON session_instances 
  IS 'Foreign key linking session_instances to session_templates'; 