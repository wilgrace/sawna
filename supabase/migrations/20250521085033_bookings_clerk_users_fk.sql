-- Migration: Change bookings.user_id foreign key to reference clerk_users(id)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES clerk_users(id) ON DELETE CASCADE; 