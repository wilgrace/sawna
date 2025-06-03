-- Drop redundant columns
ALTER TABLE session_schedules DROP COLUMN IF EXISTS template_id;
ALTER TABLE session_schedules DROP COLUMN IF EXISTS start_time_local;

-- Ensure 'time' column is of type 'time' and NOT NULL
ALTER TABLE session_schedules
  ALTER COLUMN time TYPE time USING time::time,
  ALTER COLUMN time SET NOT NULL; 