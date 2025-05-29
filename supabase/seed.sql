SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "public"."ensure_clerk_user"("p_clerk_user_id" "text", "p_email" "text", "p_first_name" "text" DEFAULT NULL::"text", "p_last_name" "text" DEFAULT NULL::"text", "p_organization_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_user_id uuid;
begin
  -- Check if user exists
  select id into v_user_id
  from public.clerk_users
  where clerk_user_id = p_clerk_user_id;

  -- If user doesn't exist, create them
  if v_user_id is null then
    insert into public.clerk_users (
      clerk_user_id,
      email,
      first_name,
      last_name,
      organization_id
    )
    values (
      p_clerk_user_id,
      p_email,
      p_first_name,
      p_last_name,
      p_organization_id
    )
    returning id into v_user_id;
  end if;

  return v_user_id;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, NOW());
  RETURN NEW;
END;
$$;

SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."clerk_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "is_super_admin" boolean DEFAULT false NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "date_of_birth" "date",
    "gender" "text",
    "ethnicity" "text",
    "home_postal_code" "text",
    "clerk_user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."saunas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "capacity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."session_instances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "original_start_time" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "is_exception" boolean DEFAULT false NOT NULL,
    "notes_for_instance" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_end_time_after_start_time" CHECK (("end_time" > "start_time")),
    CONSTRAINT "chk_exception_original_time" CHECK (((("is_exception" = true) AND ("original_start_time" IS NOT NULL)) OR (("is_exception" = false) AND ("original_start_time" IS NULL))))
);

CREATE TABLE IF NOT EXISTS "public"."session_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_template_id" "uuid" NOT NULL,
    "start_time_local" time without time zone NOT NULL,
    "day_of_week" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "time" "text" NOT NULL,
    "days" "text"[],
    CONSTRAINT "recurring_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);

CREATE TABLE IF NOT EXISTS "public"."session_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sauna_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "capacity" integer NOT NULL,
    "duration_minutes" integer NOT NULL,
    "is_open" boolean DEFAULT true NOT NULL,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "one_off_date" "date",
    "one_off_start_time" time without time zone,
    "recurrence_start_date" "date",
    "recurrence_end_date" "date",
    "created_by" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_recurring_fields" CHECK (
      (("is_recurring" = true) AND ("one_off_start_time" IS NULL) AND ("one_off_date" IS NULL) AND ("recurrence_start_date" IS NOT NULL))
      OR 
      (("is_recurring" = false) AND ("one_off_start_time" IS NOT NULL) AND ("one_off_date" IS NOT NULL) AND ("recurrence_start_date" IS NULL) AND ("recurrence_end_date" IS NULL))
    )
);

CREATE OR REPLACE TRIGGER "on_saunas_update" BEFORE UPDATE ON "public"."saunas" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "on_session_instances_update" BEFORE UPDATE ON "public"."session_instances" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "on_session_schedules_update" BEFORE UPDATE ON "public"."session_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "on_session_templates_update" BEFORE UPDATE ON "public"."session_templates" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_instance_generation(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Edge Function using pg_net
  PERFORM net.http_post(
    url := 'http://localhost:54321/functions/v1/generate-instances',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ),
    body := jsonb_build_object('template_id_to_process', template_id)
  );
END;
$$;

RESET ALL;

-- Reset the database
TRUNCATE TABLE public.session_schedules CASCADE;
TRUNCATE TABLE public.session_instances CASCADE;
TRUNCATE TABLE public.session_templates CASCADE;
TRUNCATE TABLE public.clerk_users CASCADE;
TRUNCATE TABLE public.organizations CASCADE;

-- Create sample organization
INSERT INTO public.organizations (id, name, description)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Sample Organization', 'A sample organization for testing');

-- Create sample clerk users
INSERT INTO public.clerk_users (
  id,
  clerk_user_id,
  email,
  first_name,
  last_name,
  organization_id,
  is_super_admin
)
VALUES 
  ('4e376853-0880-4b3e-a669-edf561e116dc', 'user_2xe2sYKNiaAGyXeJsG3CrCvk7vZ', 'wil.grace@gmail..com', 'Wil', 'Grace', 'dbdc958c-7dde-46db-9f3d-929b64102174', true),
  ('33333333-3333-3333-3333-333333333333', 'user_3def456', 'user@example.com', 'Regular', 'User', '11111111-1111-1111-1111-111111111111', false);

-- Create sample session templates
INSERT INTO public.session_templates (
  id,
  name,
  description,
  capacity,
  duration_minutes,
  is_open,
  is_recurring,
  one_off_date,
  one_off_start_time,
  recurrence_start_date,
  recurrence_end_date,
  created_by,
  organization_id
)
VALUES 
  -- One-off session
  ('44444444-4444-4444-4444-444444444444', 'One-off Session', 'A single session', 10, 60, true, false, 
   '2024-05-25', '10:00', NULL, NULL, 
   '4e376853-0880-4b3e-a669-edf561e116dc', '11111111-1111-1111-1111-111111111111'),
  
  -- Recurring session
  ('55555555-5555-5555-5555-555555555555', 'Weekly Session', 'A recurring weekly session', 15, 90, true, true,
   NULL, NULL, '2024-05-01', '2024-12-31',
   '4e376853-0880-4b3e-a669-edf561e116dc', '11111111-1111-1111-1111-111111111111');

-- Create sample session schedules for the recurring session
INSERT INTO public.session_schedules (
  id,
  session_template_id,
  start_time_local,
  day_of_week,
  is_active
)
VALUES 
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', '09:00', 1, true),  -- Monday
  ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '09:00', 3, true),  -- Wednesday
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '09:00', 5, true);  -- Friday

