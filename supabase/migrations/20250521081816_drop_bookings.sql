-- Drop all references to the bookings table
DROP POLICY IF EXISTS "Admins can delete bookings for their session instances" ON "public"."bookings";
DROP TRIGGER IF EXISTS "on_bookings_update" ON "public"."bookings";
DROP INDEX IF EXISTS "idx_bookings_session_instance_id";
DROP INDEX IF EXISTS "idx_bookings_user_id";
ALTER TABLE IF EXISTS "public"."bookings" DROP CONSTRAINT IF EXISTS "bookings_pkey";
ALTER TABLE IF EXISTS "public"."bookings" DROP CONSTRAINT IF EXISTS "bookings_session_instance_id_user_id_key";
ALTER TABLE IF EXISTS "public"."bookings" DROP CONSTRAINT IF EXISTS "bookings_session_instance_id_fkey";
ALTER TABLE IF EXISTS "public"."bookings" DROP CONSTRAINT IF EXISTS "bookings_user_id_fkey";

-- Finally drop the table
DROP TABLE IF EXISTS public.bookings;
