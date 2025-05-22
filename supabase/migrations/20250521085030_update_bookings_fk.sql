-- Drop the existing foreign key constraint
ALTER TABLE "public"."bookings" DROP CONSTRAINT IF EXISTS "bookings_user_id_fkey";

-- Add the new foreign key constraint referencing clerk_users
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES clerk_users(id) ON DELETE CASCADE;

-- Validate the constraint
ALTER TABLE "public"."bookings" VALIDATE CONSTRAINT "bookings_user_id_fkey"; 