-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- Recreate RLS policies with correct user_id checks
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