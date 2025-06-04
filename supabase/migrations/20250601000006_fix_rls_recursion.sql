-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

DROP POLICY IF EXISTS "Users can view session instances for their bookings" ON session_instances;
DROP POLICY IF EXISTS "Users can manage session instances for their templates" ON session_instances;

DROP POLICY IF EXISTS "Users can view their own session templates" ON session_templates;
DROP POLICY IF EXISTS "Users can manage their own session templates" ON session_templates;

DROP POLICY IF EXISTS "Users can view their own session schedules" ON session_schedules;
DROP POLICY IF EXISTS "Users can manage their own session schedules" ON session_schedules;

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_schedules ENABLE ROW LEVEL SECURITY;

-- Bookings policies
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

-- Session instances policies
CREATE POLICY "Users can view session instances"
    ON session_instances FOR SELECT
    USING (true);  -- Allow all authenticated users to view session instances

CREATE POLICY "Users can manage session instances for their templates"
    ON session_instances FOR ALL
    USING (
        template_id IN (
            SELECT id 
            FROM session_templates
            WHERE created_by::text = auth.uid()::text
        )
    )
    WITH CHECK (
        template_id IN (
            SELECT id 
            FROM session_templates
            WHERE created_by::text = auth.uid()::text
        )
    );

-- Session templates policies
CREATE POLICY "Users can view session templates"
    ON session_templates FOR SELECT
    USING (true);  -- Allow all authenticated users to view session templates

CREATE POLICY "Users can manage their own session templates"
    ON session_templates FOR ALL
    USING (created_by::text = auth.uid()::text)
    WITH CHECK (created_by::text = auth.uid()::text);

-- Session schedules policies
CREATE POLICY "Users can view session schedules"
    ON session_schedules FOR SELECT
    USING (true);  -- Allow all authenticated users to view session schedules

CREATE POLICY "Users can manage their own session schedules"
    ON session_schedules FOR ALL
    USING (
        session_template_id IN (
            SELECT id 
            FROM session_templates
            WHERE created_by::text = auth.uid()::text
        )
    )
    WITH CHECK (
        session_template_id IN (
            SELECT id 
            FROM session_templates
            WHERE created_by::text = auth.uid()::text
        )
    ); 