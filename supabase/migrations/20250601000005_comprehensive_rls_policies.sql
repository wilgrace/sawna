-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON session_instances;
DROP POLICY IF EXISTS "Enable insert for template owners" ON session_instances;
DROP POLICY IF EXISTS "Enable update for template owners" ON session_instances;
DROP POLICY IF EXISTS "Enable delete for template owners" ON session_instances;
DROP POLICY IF EXISTS "Users can manage their own session instances" ON session_instances;

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
CREATE POLICY "Users can view session instances for their bookings"
    ON session_instances FOR SELECT
    USING (
        id IN (
            SELECT session_instance_id 
            FROM bookings b
            JOIN clerk_users cu ON b.user_id = cu.id
            WHERE cu.clerk_user_id = auth.uid()::text
        )
        OR
        template_id IN (
            SELECT id 
            FROM session_templates
            WHERE created_by::text = auth.uid()::text
        )
    );

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
CREATE POLICY "Users can view their own session templates"
    ON session_templates FOR SELECT
    USING (
        created_by::text = auth.uid()::text
        OR
        id IN (
            SELECT template_id 
            FROM session_instances si
            JOIN bookings b ON si.id = b.session_instance_id
            JOIN clerk_users cu ON b.user_id = cu.id
            WHERE cu.clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage their own session templates"
    ON session_templates FOR ALL
    USING (created_by::text = auth.uid()::text)
    WITH CHECK (created_by::text = auth.uid()::text);

-- Session schedules policies
CREATE POLICY "Users can view their own session schedules"
    ON session_schedules FOR SELECT
    USING (
        session_template_id IN (
            SELECT id 
            FROM session_templates
            WHERE created_by::text = auth.uid()::text
        )
    );

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