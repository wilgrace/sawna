-- Add start_time_of_day column to session_schedules
ALTER TABLE session_schedules
  ADD COLUMN start_time_of_day TIME;

-- Update existing records to use the time column value
UPDATE session_schedules
SET start_time_of_day = time::TIME;

-- Make the column NOT NULL after populating it
ALTER TABLE session_schedules
  ALTER COLUMN start_time_of_day SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN session_schedules.start_time_of_day IS 'The time of day when the session starts (HH:MM:SS format)'; 