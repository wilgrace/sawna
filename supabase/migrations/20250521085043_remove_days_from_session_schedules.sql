-- Remove the days column from session_schedules
ALTER TABLE "public"."session_schedules" DROP COLUMN IF EXISTS "days";

-- Ensure day_of_week is NOT NULL
ALTER TABLE "public"."session_schedules" ALTER COLUMN "day_of_week" SET NOT NULL; 