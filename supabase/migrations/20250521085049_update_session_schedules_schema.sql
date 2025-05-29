-- Drop duplicate columns from session_schedules
ALTER TABLE public.session_schedules
DROP COLUMN IF EXISTS template_id,
DROP COLUMN IF EXISTS time,
DROP COLUMN IF EXISTS days;

-- Add missing columns
ALTER TABLE public.session_schedules
ADD COLUMN IF NOT EXISTS start_time_local time without time zone,
ADD COLUMN IF NOT EXISTS day_of_week integer,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add constraint for day_of_week
ALTER TABLE public.session_schedules
DROP CONSTRAINT IF EXISTS recurring_schedules_day_of_week_check;

ALTER TABLE public.session_schedules
ADD CONSTRAINT recurring_schedules_day_of_week_check 
CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_schedules_template_id
ON public.session_schedules(session_template_id);

CREATE INDEX IF NOT EXISTS idx_session_schedules_day_of_week
ON public.session_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_session_schedules_is_active
ON public.session_schedules(is_active); 