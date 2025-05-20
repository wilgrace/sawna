-- Drop the redundant template_id column and its index
DROP INDEX IF EXISTS idx_session_schedules_template_id;
ALTER TABLE "public"."session_schedules" DROP COLUMN IF EXISTS "template_id";

-- Rename the index to be more consistent
DROP INDEX IF EXISTS idx_recurring_schedules_template_id;
CREATE INDEX idx_session_schedules_template_id ON public.session_schedules USING btree (session_template_id); 