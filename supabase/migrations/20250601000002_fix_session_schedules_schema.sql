-- Drop existing table if it exists
DROP TABLE IF EXISTS "public"."session_schedules";

-- Recreate the table with the correct schema
CREATE TABLE "public"."session_schedules" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "session_template_id" uuid NOT NULL,
    "day_of_week" integer NOT NULL,
    "time" time without time zone NOT NULL,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "session_schedules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_schedules_session_template_id_fkey" FOREIGN KEY ("session_template_id") REFERENCES "public"."session_templates"("id") ON DELETE CASCADE,
    CONSTRAINT "recurring_schedules_day_of_week_check" CHECK (("day_of_week" >= 0 AND "day_of_week" <= 6))
);

-- Add indexes
CREATE INDEX "idx_session_schedules_template_id" ON "public"."session_schedules" USING btree ("session_template_id");
CREATE INDEX "idx_session_schedules_day_time" ON "public"."session_schedules" USING btree ("day_of_week", "time");

-- Add RLS policies
ALTER TABLE "public"."session_schedules" ENABLE ROW LEVEL SECURITY;

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

-- Add trigger for updated_at
CREATE TRIGGER on_session_schedules_update
    BEFORE UPDATE ON public.session_schedules
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 