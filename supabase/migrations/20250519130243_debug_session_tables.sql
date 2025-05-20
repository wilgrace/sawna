-- First, let's check for any orphaned records
DELETE FROM session_schedules 
WHERE session_template_id NOT IN (SELECT id FROM session_templates);

DELETE FROM session_instances 
WHERE template_id NOT IN (SELECT id FROM session_templates);

-- Ensure all required columns are not null
ALTER TABLE session_templates
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN capacity SET NOT NULL,
  ALTER COLUMN duration_minutes SET NOT NULL,
  ALTER COLUMN is_open SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE session_schedules
  ALTER COLUMN session_template_id SET NOT NULL,
  -- ALTER COLUMN start_time_of_day SET NOT NULL, -- commented out, column does not exist
  ALTER COLUMN day_of_week SET NOT NULL;

ALTER TABLE session_instances
  ALTER COLUMN template_id SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- Add default values for boolean columns
ALTER TABLE session_templates
  ALTER COLUMN is_open SET DEFAULT false;

-- Add check constraints for valid values
ALTER TABLE session_schedules
  ADD CONSTRAINT valid_day_of_week 
  CHECK (day_of_week >= 0 AND day_of_week <= 6);

ALTER TABLE session_instances
  ADD CONSTRAINT valid_status 
  CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-- Add check for valid date range
ALTER TABLE session_instances
  ADD CONSTRAINT valid_date_range 
  CHECK (end_time > start_time);

-- Add RLS policies if they don't exist
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_instances ENABLE ROW LEVEL SECURITY;

-- Policy for session_templates
CREATE POLICY "Allow service role full access to session_templates"
  ON session_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for session_schedules
CREATE POLICY "Allow service role full access to session_schedules"
  ON session_schedules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for session_instances
CREATE POLICY "Allow service role full access to session_instances"
  ON session_instances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 