-- Create profiles table
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" text NOT NULL,
    "email" text NOT NULL,
    "first_name" text,
    "last_name" text,
    "organization_id" uuid,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- Add RLS policies
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
ON "public"."profiles"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON "public"."profiles"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Enable update for users based on id"
ON "public"."profiles"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Add foreign key to organizations
ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" 
    FOREIGN KEY ("organization_id") 
    REFERENCES "public"."organizations"("id") 
    ON DELETE SET NULL;

-- Add comment
COMMENT ON TABLE "public"."profiles" IS 'Stores app-specific user data, populated by Clerk webhooks'; 