-- Add time column
ALTER TABLE "public"."session_schedules" 
ADD COLUMN "time" time;

-- Copy data from start_time_local to time
UPDATE "public"."session_schedules"
SET "time" = start_time_local;

-- Make time column NOT NULL after data is copied
ALTER TABLE "public"."session_schedules" 
ALTER COLUMN "time" SET NOT NULL;

-- Update the index to include the time column
DROP INDEX IF EXISTS idx_session_schedules_day_time;
CREATE INDEX idx_session_schedules_day_time ON public.session_schedules USING btree (day_of_week, time); 