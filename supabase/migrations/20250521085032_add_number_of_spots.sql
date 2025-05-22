-- Add number_of_spots column to bookings table
ALTER TABLE "public"."bookings" 
ADD COLUMN IF NOT EXISTS "number_of_spots" integer NOT NULL DEFAULT 1;

-- Update existing rows to have number_of_spots = 1
UPDATE "public"."bookings" 
SET "number_of_spots" = 1 
WHERE "number_of_spots" IS NULL; 