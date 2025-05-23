-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_instance_id UUID NOT NULL REFERENCES session_instances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES clerk_users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed',
    number_of_spots INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT valid_status CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_session_instance_id ON bookings(session_instance_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);

-- Add RLS policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
    ON bookings FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
    ON bookings FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
    ON bookings FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
    ON bookings FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM clerk_users
            WHERE clerk_user_id = auth.uid()::text
        )
    ); 