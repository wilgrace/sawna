-- Add one_off_date column
ALTER TABLE "public"."session_templates" 
ADD COLUMN "one_off_date" date;

-- First update the date column while we still have the timestamp
UPDATE "public"."session_templates"
SET "one_off_date" = DATE(one_off_start_time AT TIME ZONE 'Europe/London')
WHERE one_off_start_time IS NOT NULL;

-- Then alter the column type to time without time zone
ALTER TABLE "public"."session_templates"
ALTER COLUMN "one_off_start_time" TYPE time without time zone
USING (one_off_start_time AT TIME ZONE 'Europe/London')::time without time zone;

-- Set one_off_date to NULL for recurring sessions
UPDATE "public"."session_templates"
SET "one_off_date" = NULL
WHERE "is_recurring" = true;

-- Ensure all one-off sessions have a valid date
UPDATE "public"."session_templates"
SET "one_off_date" = CURRENT_DATE
WHERE "is_recurring" = false AND "one_off_date" IS NULL;

-- Update the constraint to handle NULL values appropriately
ALTER TABLE "public"."session_templates" 
DROP CONSTRAINT IF EXISTS "chk_recurring_fields";

ALTER TABLE "public"."session_templates" 
ADD CONSTRAINT "chk_recurring_fields" CHECK (
  (("is_recurring" = true) AND ("one_off_start_time" IS NULL) AND ("one_off_date" IS NULL) AND ("recurrence_start_date" IS NOT NULL)) OR 
  (("is_recurring" = false) AND ("one_off_start_time" IS NOT NULL) AND ("one_off_date" IS NOT NULL) AND ("recurrence_start_date" IS NULL) AND ("recurrence_end_date" IS NULL))
); 