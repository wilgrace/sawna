-- Rollback time standardization changes

-- 1. Add back the local time columns
ALTER TABLE "public"."session_schedules" 
ADD COLUMN "start_time_local" time,
ADD COLUMN "time" time;

-- 2. Convert UTC times back to local times
UPDATE "public"."session_schedules"
SET "start_time_local" = (
  (start_time_utc AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/London')::time
);

-- 3. Drop the UTC column
ALTER TABLE "public"."session_schedules" 
DROP COLUMN "start_time_utc";

-- 4. Revert session_templates one_off_start_time to time type
ALTER TABLE "public"."session_templates"
ALTER COLUMN "one_off_start_time" TYPE time
USING (
  CASE 
    WHEN one_off_start_time IS NOT NULL 
    THEN (one_off_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/London')::time
    ELSE NULL
  END
);

-- 5. Recreate original index
DROP INDEX IF EXISTS idx_session_schedules_day_time;
CREATE INDEX idx_session_schedules_day_time ON public.session_schedules 
USING btree (day_of_week, start_time_local);

-- 6. Remove the time handling comment
COMMENT ON TABLE "public"."session_schedules" IS NULL; 