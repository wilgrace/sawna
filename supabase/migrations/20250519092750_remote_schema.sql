create extension if not exists "wrappers" with schema "extensions";


create table "public"."bookings" (
    "id" uuid not null default uuid_generate_v4(),
    "session_instance_id" uuid not null,
    "user_id" uuid not null,
    "status" text not null default 'confirmed'::text,
    "number_of_spots" integer not null default 1,
    "booked_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."bookings" enable row level security;

create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "logo_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."organizations" enable row level security;

create table "public"."saunas" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "capacity" integer not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."saunas" enable row level security;

create table "public"."session_instances" (
    "id" uuid not null default uuid_generate_v4(),
    "template_id" uuid not null,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "original_start_time" timestamp with time zone,
    "status" text not null default 'scheduled'::text,
    "is_exception" boolean not null default false,
    "notes_for_instance" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."session_instances" enable row level security;

create table "public"."session_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "session_template_id" uuid not null,
    "start_time_local" time without time zone not null,
    "day_of_week" integer,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "template_id" uuid not null,
    "time" text not null,
    "days" text[]
);


alter table "public"."session_schedules" enable row level security;

create table "public"."session_templates" (
    "id" uuid not null default uuid_generate_v4(),
    "sauna_id" uuid,
    "name" text not null,
    "description" text,
    "capacity" integer not null,
    "duration_minutes" integer not null,
    "is_open" boolean not null default true,
    "is_recurring" boolean not null default false,
    "one_off_start_time" timestamp with time zone,
    "recurrence_start_date" date,
    "recurrence_end_date" date,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."session_templates" enable row level security;

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid,
    "is_super_admin" boolean not null default false,
    "email" text not null,
    "first_name" text,
    "last_name" text,
    "date_of_birth" date,
    "gender" text,
    "ethnicity" text,
    "home_postal_code" text,
    "clerk_user_id" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);

CREATE UNIQUE INDEX bookings_session_instance_id_user_id_key ON public.bookings USING btree (session_instance_id, user_id);

CREATE INDEX idx_bookings_session_instance_id ON public.bookings USING btree (session_instance_id);

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);

CREATE INDEX idx_recurring_schedules_template_id ON public.session_schedules USING btree (session_template_id);

CREATE INDEX idx_session_instances_end_time ON public.session_instances USING btree (end_time);

CREATE INDEX idx_session_instances_original_start_time ON public.session_instances USING btree (original_start_time);

CREATE INDEX idx_session_instances_start_time ON public.session_instances USING btree (start_time);

CREATE INDEX idx_session_instances_template_id ON public.session_instances USING btree (template_id);

CREATE INDEX idx_session_schedules_day_of_week ON public.session_schedules USING btree (day_of_week);

CREATE INDEX idx_session_schedules_template_id ON public.session_schedules USING btree (template_id);

CREATE INDEX idx_session_templates_created_by ON public.session_templates USING btree (created_by);

CREATE INDEX idx_session_templates_sauna_id ON public.session_templates USING btree (sauna_id);

CREATE INDEX idx_users_clerk_user_id ON public.users USING btree (clerk_user_id);

CREATE INDEX idx_users_organization_id ON public.users USING btree (organization_id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX recurring_schedules_pkey ON public.session_schedules USING btree (id);

CREATE UNIQUE INDEX saunas_pkey ON public.saunas USING btree (id);

CREATE UNIQUE INDEX session_instances_pkey ON public.session_instances USING btree (id);

CREATE UNIQUE INDEX session_templates_pkey ON public.session_templates USING btree (id);

CREATE UNIQUE INDEX users_clerk_user_id_key ON public.users USING btree (clerk_user_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."saunas" add constraint "saunas_pkey" PRIMARY KEY using index "saunas_pkey";

alter table "public"."session_instances" add constraint "session_instances_pkey" PRIMARY KEY using index "session_instances_pkey";

alter table "public"."session_schedules" add constraint "recurring_schedules_pkey" PRIMARY KEY using index "recurring_schedules_pkey";

alter table "public"."session_templates" add constraint "session_templates_pkey" PRIMARY KEY using index "session_templates_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."bookings" add constraint "bookings_session_instance_id_fkey" FOREIGN KEY (session_instance_id) REFERENCES session_instances(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_session_instance_id_fkey";

alter table "public"."bookings" add constraint "bookings_session_instance_id_user_id_key" UNIQUE using index "bookings_session_instance_id_user_id_key";

alter table "public"."bookings" add constraint "bookings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_user_id_fkey";

alter table "public"."session_instances" add constraint "chk_end_time_after_start_time" CHECK ((end_time > start_time)) not valid;

alter table "public"."session_instances" validate constraint "chk_end_time_after_start_time";

alter table "public"."session_instances" add constraint "chk_exception_original_time" CHECK ((((is_exception = true) AND (original_start_time IS NOT NULL)) OR ((is_exception = false) AND (original_start_time IS NULL)))) not valid;

alter table "public"."session_instances" validate constraint "chk_exception_original_time";

alter table "public"."session_instances" add constraint "session_instances_template_id_fkey" FOREIGN KEY (template_id) REFERENCES session_templates(id) ON DELETE CASCADE not valid;

alter table "public"."session_instances" validate constraint "session_instances_template_id_fkey";

alter table "public"."session_schedules" add constraint "recurring_schedules_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."session_schedules" validate constraint "recurring_schedules_day_of_week_check";

alter table "public"."session_templates" add constraint "chk_recurring_fields" CHECK ((((is_recurring = true) AND (one_off_start_time IS NULL) AND (recurrence_start_date IS NOT NULL)) OR ((is_recurring = false) AND (one_off_start_time IS NOT NULL) AND (recurrence_start_date IS NULL) AND (recurrence_end_date IS NULL)))) not valid;

alter table "public"."session_templates" validate constraint "chk_recurring_fields";

alter table "public"."session_templates" add constraint "session_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."session_templates" validate constraint "session_templates_created_by_fkey";

alter table "public"."session_templates" add constraint "session_templates_sauna_id_fkey" FOREIGN KEY (sauna_id) REFERENCES saunas(id) ON DELETE SET NULL not valid;

alter table "public"."session_templates" validate constraint "session_templates_sauna_id_fkey";

alter table "public"."users" add constraint "users_clerk_user_id_key" UNIQUE using index "users_clerk_user_id_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_organization_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, NOW());
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."bookings" to "anon";

grant insert on table "public"."bookings" to "anon";

grant references on table "public"."bookings" to "anon";

grant select on table "public"."bookings" to "anon";

grant trigger on table "public"."bookings" to "anon";

grant truncate on table "public"."bookings" to "anon";

grant update on table "public"."bookings" to "anon";

grant delete on table "public"."bookings" to "authenticated";

grant insert on table "public"."bookings" to "authenticated";

grant references on table "public"."bookings" to "authenticated";

grant select on table "public"."bookings" to "authenticated";

grant trigger on table "public"."bookings" to "authenticated";

grant truncate on table "public"."bookings" to "authenticated";

grant update on table "public"."bookings" to "authenticated";

grant delete on table "public"."bookings" to "service_role";

grant insert on table "public"."bookings" to "service_role";

grant references on table "public"."bookings" to "service_role";

grant select on table "public"."bookings" to "service_role";

grant trigger on table "public"."bookings" to "service_role";

grant truncate on table "public"."bookings" to "service_role";

grant update on table "public"."bookings" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."saunas" to "anon";

grant insert on table "public"."saunas" to "anon";

grant references on table "public"."saunas" to "anon";

grant select on table "public"."saunas" to "anon";

grant trigger on table "public"."saunas" to "anon";

grant truncate on table "public"."saunas" to "anon";

grant update on table "public"."saunas" to "anon";

grant delete on table "public"."saunas" to "authenticated";

grant insert on table "public"."saunas" to "authenticated";

grant references on table "public"."saunas" to "authenticated";

grant select on table "public"."saunas" to "authenticated";

grant trigger on table "public"."saunas" to "authenticated";

grant truncate on table "public"."saunas" to "authenticated";

grant update on table "public"."saunas" to "authenticated";

grant delete on table "public"."saunas" to "service_role";

grant insert on table "public"."saunas" to "service_role";

grant references on table "public"."saunas" to "service_role";

grant select on table "public"."saunas" to "service_role";

grant trigger on table "public"."saunas" to "service_role";

grant truncate on table "public"."saunas" to "service_role";

grant update on table "public"."saunas" to "service_role";

grant delete on table "public"."session_instances" to "anon";

grant insert on table "public"."session_instances" to "anon";

grant references on table "public"."session_instances" to "anon";

grant select on table "public"."session_instances" to "anon";

grant trigger on table "public"."session_instances" to "anon";

grant truncate on table "public"."session_instances" to "anon";

grant update on table "public"."session_instances" to "anon";

grant delete on table "public"."session_instances" to "authenticated";

grant insert on table "public"."session_instances" to "authenticated";

grant references on table "public"."session_instances" to "authenticated";

grant select on table "public"."session_instances" to "authenticated";

grant trigger on table "public"."session_instances" to "authenticated";

grant truncate on table "public"."session_instances" to "authenticated";

grant update on table "public"."session_instances" to "authenticated";

grant delete on table "public"."session_instances" to "service_role";

grant insert on table "public"."session_instances" to "service_role";

grant references on table "public"."session_instances" to "service_role";

grant select on table "public"."session_instances" to "service_role";

grant trigger on table "public"."session_instances" to "service_role";

grant truncate on table "public"."session_instances" to "service_role";

grant update on table "public"."session_instances" to "service_role";

grant delete on table "public"."session_schedules" to "anon";

grant insert on table "public"."session_schedules" to "anon";

grant references on table "public"."session_schedules" to "anon";

grant select on table "public"."session_schedules" to "anon";

grant trigger on table "public"."session_schedules" to "anon";

grant truncate on table "public"."session_schedules" to "anon";

grant update on table "public"."session_schedules" to "anon";

grant delete on table "public"."session_schedules" to "authenticated";

grant insert on table "public"."session_schedules" to "authenticated";

grant references on table "public"."session_schedules" to "authenticated";

grant select on table "public"."session_schedules" to "authenticated";

grant trigger on table "public"."session_schedules" to "authenticated";

grant truncate on table "public"."session_schedules" to "authenticated";

grant update on table "public"."session_schedules" to "authenticated";

grant delete on table "public"."session_schedules" to "service_role";

grant insert on table "public"."session_schedules" to "service_role";

grant references on table "public"."session_schedules" to "service_role";

grant select on table "public"."session_schedules" to "service_role";

grant trigger on table "public"."session_schedules" to "service_role";

grant truncate on table "public"."session_schedules" to "service_role";

grant update on table "public"."session_schedules" to "service_role";

grant delete on table "public"."session_templates" to "anon";

grant insert on table "public"."session_templates" to "anon";

grant references on table "public"."session_templates" to "anon";

grant select on table "public"."session_templates" to "anon";

grant trigger on table "public"."session_templates" to "anon";

grant truncate on table "public"."session_templates" to "anon";

grant update on table "public"."session_templates" to "anon";

grant delete on table "public"."session_templates" to "authenticated";

grant insert on table "public"."session_templates" to "authenticated";

grant references on table "public"."session_templates" to "authenticated";

grant select on table "public"."session_templates" to "authenticated";

grant trigger on table "public"."session_templates" to "authenticated";

grant truncate on table "public"."session_templates" to "authenticated";

grant update on table "public"."session_templates" to "authenticated";

grant delete on table "public"."session_templates" to "service_role";

grant insert on table "public"."session_templates" to "service_role";

grant references on table "public"."session_templates" to "service_role";

grant select on table "public"."session_templates" to "service_role";

grant trigger on table "public"."session_templates" to "service_role";

grant truncate on table "public"."session_templates" to "service_role";

grant update on table "public"."session_templates" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Admins can delete bookings for their session instances"
on "public"."bookings"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM (session_instances si
     JOIN session_templates st ON ((si.template_id = st.id)))
  WHERE ((si.id = bookings.session_instance_id) AND (st.created_by = auth.uid())))));


create policy "Admins can view bookings for their session instances"
on "public"."bookings"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (session_instances si
     JOIN session_templates st ON ((si.template_id = st.id)))
  WHERE ((si.id = bookings.session_instance_id) AND (st.created_by = auth.uid())))));


create policy "Users can create their own bookings"
on "public"."bookings"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own bookings"
on "public"."bookings"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own bookings"
on "public"."bookings"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Public can view saunas"
on "public"."saunas"
as permissive
for select
to authenticated, anon
using (true);


create policy "Admins can manage instances of their own templates"
on "public"."session_instances"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM session_templates st
  WHERE ((st.id = session_instances.template_id) AND (st.created_by = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM session_templates st
  WHERE ((st.id = session_instances.template_id) AND (st.created_by = auth.uid())))));


create policy "Authenticated users can view open session instances"
on "public"."session_instances"
as permissive
for select
to authenticated
using (((EXISTS ( SELECT 1
   FROM session_templates st
  WHERE ((st.id = session_instances.template_id) AND (st.is_open = true)))) AND (status = 'scheduled'::text) AND (start_time > timezone('utc'::text, now()))));


create policy "Admins can manage their own session templates"
on "public"."session_templates"
as permissive
for all
to public
using ((auth.uid() = created_by))
with check ((auth.uid() = created_by));


CREATE TRIGGER on_bookings_update BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_saunas_update BEFORE UPDATE ON public.saunas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_session_instances_update BEFORE UPDATE ON public.session_instances FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_session_schedules_update BEFORE UPDATE ON public.session_schedules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_session_templates_update BEFORE UPDATE ON public.session_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


