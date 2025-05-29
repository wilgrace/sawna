-- Add missing columns to session_templates
ALTER TABLE public.session_templates
ADD COLUMN IF NOT EXISTS one_off_date date,
ADD COLUMN IF NOT EXISTS one_off_start_time time without time zone,
ADD COLUMN IF NOT EXISTS recurrence_start_date date,
ADD COLUMN IF NOT EXISTS recurrence_end_date date;

-- Update the constraint to handle NULL values appropriately
ALTER TABLE public.session_templates 
DROP CONSTRAINT IF EXISTS chk_recurring_fields;

ALTER TABLE public.session_templates 
ADD CONSTRAINT chk_recurring_fields CHECK (
  (("is_recurring" = true) AND ("one_off_start_time" IS NULL) AND ("one_off_date" IS NULL) AND ("recurrence_start_date" IS NOT NULL)) OR 
  (("is_recurring" = false) AND ("one_off_start_time" IS NOT NULL) AND ("one_off_date" IS NOT NULL) AND ("recurrence_start_date" IS NULL) AND ("recurrence_end_date" IS NULL))
);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_session_templates_one_off_date
ON public.session_templates(one_off_date);

CREATE INDEX IF NOT EXISTS idx_session_templates_recurrence_start_date
ON public.session_templates(recurrence_start_date);

CREATE INDEX IF NOT EXISTS idx_session_templates_recurrence_end_date
ON public.session_templates(recurrence_end_date); 