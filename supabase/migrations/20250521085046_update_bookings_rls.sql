-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- Recreate RLS policies with correct clerk_user_id checks
CREATE POLICY "Users can view their own bookings"
    ON bookings FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert their own bookings"
    ON bookings FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their own bookings"
    ON bookings FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete their own bookings"
    ON bookings FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Update session templates timezone
ALTER TABLE session_templates
ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- Add check constraint for recurring fields
ALTER TABLE session_templates
DROP CONSTRAINT IF EXISTS chk_recurring_fields;

ALTER TABLE session_templates
ADD CONSTRAINT chk_recurring_fields CHECK (
    (is_recurring = true AND one_off_start_time IS NULL AND one_off_date IS NULL AND recurrence_start_date IS NOT NULL) OR
    (is_recurring = false AND one_off_start_time IS NOT NULL AND one_off_date IS NOT NULL AND recurrence_start_date IS NULL AND recurrence_end_date IS NULL)
); 