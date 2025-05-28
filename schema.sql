

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






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, NOW());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_instance_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "number_of_spots" integer DEFAULT 1 NOT NULL,
    "booked_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


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


ALTER TABLE "public"."clerk_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."clerk_users" IS 'Platform users, linked to Clerk Auth';



COMMENT ON COLUMN "public"."clerk_users"."organization_id" IS 'The organization the user belongs to (NULL for Super Admins)';



COMMENT ON COLUMN "public"."clerk_users"."date_of_birth" IS 'User date of birth - Handle privacy';



COMMENT ON COLUMN "public"."clerk_users"."gender" IS 'User gender identity - Handle privacy';



COMMENT ON COLUMN "public"."clerk_users"."ethnicity" IS 'User ethnicity - Handle privacy';



COMMENT ON COLUMN "public"."clerk_users"."home_postal_code" IS 'User home postcode - Handle privacy';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."organizations" IS 'Top-level entity (tenant) offering sauna services';



CREATE TABLE IF NOT EXISTS "public"."saunas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "capacity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."saunas" OWNER TO "postgres";


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


ALTER TABLE "public"."session_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_template_id" "uuid" NOT NULL,
    "start_time_local" time without time zone NOT NULL,
    "day_of_week" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "time" "text" NOT NULL,
    "days" "text"[],
    CONSTRAINT "recurring_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."session_schedules" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_schedules" IS 'Defines recurrence patterns for session templates';



CREATE TABLE IF NOT EXISTS "public"."session_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sauna_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "capacity" integer NOT NULL,
    "duration_minutes" integer NOT NULL,
    "is_open" boolean DEFAULT true NOT NULL,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "one_off_start_time" time without time zone,
    "one_off_date" date,
    "recurrence_start_date" "date",
    "recurrence_end_date" "date",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "chk_recurring_fields" CHECK (((("is_recurring" = true) AND ("one_off_start_time" IS NULL) AND ("one_off_date" IS NULL) AND ("recurrence_start_date" IS NOT NULL)) OR (("is_recurring" = false) AND ("one_off_start_time" IS NOT NULL) AND ("one_off_date" IS NOT NULL) AND ("recurrence_start_date" IS NULL) AND ("recurrence_end_date" IS NULL))))
);


ALTER TABLE "public"."session_templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_session_instance_id_user_id_key" UNIQUE ("session_instance_id", "user_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_schedules"
    ADD CONSTRAINT "recurring_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saunas"
    ADD CONSTRAINT "saunas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_instances"
    ADD CONSTRAINT "session_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clerk_users"
    ADD CONSTRAINT "users_clerk_user_id_key" UNIQUE ("clerk_user_id");



ALTER TABLE ONLY "public"."clerk_users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clerk_users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bookings_session_instance_id" ON "public"."bookings" USING "btree" ("session_instance_id");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_recurring_schedules_template_id" ON "public"."session_schedules" USING "btree" ("session_template_id");



CREATE INDEX "idx_session_instances_end_time" ON "public"."session_instances" USING "btree" ("end_time");



CREATE INDEX "idx_session_instances_original_start_time" ON "public"."session_instances" USING "btree" ("original_start_time");



CREATE INDEX "idx_session_instances_start_time" ON "public"."session_instances" USING "btree" ("start_time");



CREATE INDEX "idx_session_instances_template_id" ON "public"."session_instances" USING "btree" ("template_id");



CREATE INDEX "idx_session_schedules_day_of_week" ON "public"."session_schedules" USING "btree" ("day_of_week");



CREATE INDEX "idx_session_schedules_template_id" ON "public"."session_schedules" USING "btree" ("template_id");



CREATE INDEX "idx_session_templates_created_by" ON "public"."session_templates" USING "btree" ("created_by");



CREATE INDEX "idx_session_templates_sauna_id" ON "public"."session_templates" USING "btree" ("sauna_id");



CREATE INDEX "idx_users_clerk_user_id" ON "public"."clerk_users" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_users_organization_id" ON "public"."clerk_users" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "on_bookings_update" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_saunas_update" BEFORE UPDATE ON "public"."saunas" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_session_instances_update" BEFORE UPDATE ON "public"."session_instances" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_session_schedules_update" BEFORE UPDATE ON "public"."session_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_session_templates_update" BEFORE UPDATE ON "public"."session_templates" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_session_instance_id_fkey" FOREIGN KEY ("session_instance_id") REFERENCES "public"."session_instances"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_instances"
    ADD CONSTRAINT "session_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."session_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_schedules"
    ADD CONSTRAINT "session_schedules_session_template_id_fkey" FOREIGN KEY ("session_template_id") REFERENCES "public"."session_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."clerk_users"("id");



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_sauna_id_fkey" FOREIGN KEY ("sauna_id") REFERENCES "public"."saunas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clerk_users"
    ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can delete bookings for their session instances" ON "public"."bookings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."session_instances" "si"
     JOIN "public"."session_templates" "st" ON (("si"."template_id" = "st"."id")))
  WHERE (("si"."id" = "bookings"."session_instance_id") AND ("st"."created_by" = "auth"."uid"())))));



CREATE POLICY "Admins can manage instances of their own templates" ON "public"."session_instances" USING ((EXISTS ( SELECT 1
   FROM "public"."session_templates" "st"
  WHERE (("st"."id" = "session_instances"."template_id") AND ("st"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."session_templates" "st"
  WHERE (("st"."id" = "session_instances"."template_id") AND ("st"."created_by" = "auth"."uid"())))));



CREATE POLICY "Admins can manage their own session templates" ON "public"."session_templates" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Admins can view bookings for their session instances" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."session_instances" "si"
     JOIN "public"."session_templates" "st" ON (("si"."template_id" = "st"."id")))
  WHERE (("si"."id" = "bookings"."session_instance_id") AND ("st"."created_by" = "auth"."uid"())))));



CREATE POLICY "Authenticated users can view open session instances" ON "public"."session_instances" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."session_templates" "st"
  WHERE (("st"."id" = "session_instances"."template_id") AND ("st"."is_open" = true)))) AND ("status" = 'scheduled'::"text") AND ("start_time" > "timezone"('utc'::"text", "now"()))));



CREATE POLICY "Enable insert for authenticated users" ON "public"."clerk_users" FOR INSERT TO "authenticated" WITH CHECK ((("clerk_user_id" = ("auth"."uid"())::"text") AND (("organization_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."organizations"
  WHERE ("organizations"."id" = "clerk_users"."organization_id"))))));



CREATE POLICY "Enable read access for authenticated users" ON "public"."clerk_users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for users based on clerk_user_id" ON "public"."clerk_users" FOR UPDATE TO "authenticated" USING (("clerk_user_id" = ("auth"."uid"())::"text")) WITH CHECK ((("clerk_user_id" = ("auth"."uid"())::"text") AND (("organization_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."organizations"
  WHERE ("organizations"."id" = "clerk_users"."organization_id"))))));



CREATE POLICY "Public can view saunas" ON "public"."saunas" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can create their own bookings" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bookings" ON "public"."bookings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clerk_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saunas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_templates" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





















































































































































































































































































































GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



























GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."clerk_users" TO "anon";
GRANT ALL ON TABLE "public"."clerk_users" TO "authenticated";
GRANT ALL ON TABLE "public"."clerk_users" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."saunas" TO "anon";
GRANT ALL ON TABLE "public"."saunas" TO "authenticated";
GRANT ALL ON TABLE "public"."saunas" TO "service_role";



GRANT ALL ON TABLE "public"."session_instances" TO "anon";
GRANT ALL ON TABLE "public"."session_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."session_instances" TO "service_role";



GRANT ALL ON TABLE "public"."session_schedules" TO "anon";
GRANT ALL ON TABLE "public"."session_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."session_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."session_templates" TO "anon";
GRANT ALL ON TABLE "public"."session_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."session_templates" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
