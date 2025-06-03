-- Drop the duplicate time column if it exists
ALTER TABLE "public"."session_schedules" DROP COLUMN IF EXISTS "start_time_local";

-- Ensure the time column is of type time without time zone
ALTER TABLE "public"."session_schedules" 
ALTER COLUMN "time" TYPE time without time zone;

-- Add a check constraint for day_of_week
ALTER TABLE "public"."session_schedules" 
DROP CONSTRAINT IF EXISTS "recurring_schedules_day_of_week_check";

ALTER TABLE "public"."session_schedules" 
ADD CONSTRAINT "recurring_schedules_day_of_week_check" 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Add an index for efficient querying
CREATE INDEX IF NOT EXISTS "idx_session_schedules_day_time" 
ON "public"."session_schedules" (day_of_week, time);

-- Add RLS policies if they don't exist
ALTER TABLE "public"."session_schedules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_schedules' 
    AND policyname = 'Admins can manage schedules for their own templates'
  ) THEN
    CREATE POLICY "Admins can manage schedules for their own templates"
    ON "public"."session_schedules"
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM session_templates st
        JOIN clerk_users cu ON st.created_by = cu.id
        WHERE st.id = session_schedules.session_template_id
        AND cu.clerk_user_id = auth.uid()::text
      )
    );
  END IF;
END $$; 