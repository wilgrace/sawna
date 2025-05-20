-- Create profiles table
CREATE TABLE "public"."profiles" (
    "id" TEXT NOT NULL PRIMARY KEY, -- Stores Clerk User ID
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "organization_id" UUID REFERENCES "public"."organizations"("id") ON DELETE SET NULL,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX "idx_profiles_email" ON "public"."profiles" ("email");
CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" ("organization_id");

-- Add RLS policies
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Allow super admins to read all profiles
CREATE POLICY "Super admins can view all profiles"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "public"."profiles"
        WHERE id = auth.uid()::text
        AND is_super_admin = true
    )
);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION "public"."handle_profile_update"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
CREATE TRIGGER "on_profile_update"
    BEFORE UPDATE ON "public"."profiles"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_profile_update"();

-- Grant necessary permissions
GRANT ALL ON "public"."profiles" TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 