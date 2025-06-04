-- Drop the current clerk_users table
DROP TABLE IF EXISTS clerk_users;

-- Recreate the table with the original structure
CREATE TABLE IF NOT EXISTS "public"."clerk_users" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" uuid,
    "is_super_admin" boolean NOT NULL DEFAULT false,
    "email" text NOT NULL,
    "first_name" text,
    "last_name" text,
    "date_of_birth" date,
    "gender" text,
    "ethnicity" text,
    "home_postal_code" text,
    "clerk_user_id" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_clerk_user_id_key" UNIQUE ("clerk_user_id"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

-- Add RLS policies
ALTER TABLE clerk_users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view their own data" ON clerk_users
    FOR SELECT
    USING (auth.uid()::text = clerk_user_id);

-- Allow service role to manage all records
CREATE POLICY "Service role can manage all records" ON clerk_users
    USING (auth.role() = 'service_role'); 