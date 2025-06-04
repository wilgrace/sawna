-- Standardize time handling across the database

-- 1. First, add UTC time columns to session_schedules
ALTER TABLE "public"."session_schedules" 
ADD COLUMN "start_time_utc" timestamptz;

-- 2. Convert existing local times to UTC
UPDATE "public"."session_schedules"
SET "start_time_utc" = (
  -- Create a timestamp with the local time and convert to UTC
  (CURRENT_DATE + start_time_local) AT TIME ZONE 'Europe/London' AT TIME ZONE 'UTC'
);

-- 3. Make the new column NOT NULL after data is migrated
ALTER TABLE "public"."session_schedules" 
ALTER COLUMN "start_time_utc" SET NOT NULL;

-- 4. Drop redundant columns
ALTER TABLE "public"."session_schedules" 
DROP COLUMN "start_time_local",
DROP COLUMN "time";

-- 5. Update session_templates to use timestamptz for one_off_start_time
ALTER TABLE "public"."session_templates"
ALTER COLUMN "one_off_start_time" TYPE timestamptz
USING (
  CASE
    WHEN one_off_start_time IS NOT NULL AND one_off_date IS NOT NULL
    THEN (one_off_date + one_off_start_time::time) AT TIME ZONE 'Europe/London' AT TIME ZONE 'UTC'
    ELSE one_off_start_time
  END
);

-- 6. Update indexes
DROP INDEX IF EXISTS idx_session_schedules_day_time;
CREATE INDEX idx_session_schedules_day_time ON public.session_schedules 
USING btree (day_of_week, start_time_utc);

-- 7. Add a comment explaining the time handling
COMMENT ON TABLE "public"."session_schedules" IS 'All times are stored in UTC. Use AT TIME ZONE to convert to local time when querying.'; 