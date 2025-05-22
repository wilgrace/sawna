-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON "public"."bookings";
DROP POLICY IF EXISTS "Users can create their own bookings" ON "public"."bookings";
DROP POLICY IF EXISTS "Users can update their own bookings" ON "public"."bookings";
DROP POLICY IF EXISTS "Admins can view bookings for their session instances" ON "public"."bookings";
DROP POLICY IF EXISTS "Admins can view bookings for their session templates" ON "public"."bookings";

-- Create new policies
CREATE POLICY "Users can view their own bookings"
    ON "public"."bookings"
    FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create their own bookings"
    ON "public"."bookings"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their own bookings"
    ON "public"."bookings"
    FOR UPDATE
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view bookings for their session instances"
    ON "public"."bookings"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM session_instances si
            JOIN session_templates st ON si.template_id = st.id
            JOIN clerk_users cu ON st.created_by = cu.id
            WHERE si.id = bookings.session_instance_id
            AND cu.clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view bookings for their session templates"
    ON "public"."bookings"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM session_instances si
            JOIN session_templates st ON si.template_id = st.id
            JOIN clerk_users cu ON st.created_by = cu.id
            WHERE si.id = bookings.session_instance_id
            AND cu.clerk_user_id = auth.uid()::text
        )
    ); 