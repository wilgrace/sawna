revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."users" drop constraint "users_clerk_user_id_key";

alter table "public"."users" drop constraint "users_email_key";

alter table "public"."users" drop constraint "users_organization_id_fkey";

alter table "public"."session_templates" drop constraint "session_templates_created_by_fkey";

alter table "public"."users" drop constraint "users_pkey";

drop index if exists "public"."idx_users_clerk_user_id";

drop index if exists "public"."idx_users_organization_id";

drop index if exists "public"."users_clerk_user_id_key";

drop index if exists "public"."users_email_key";

drop index if exists "public"."users_pkey";

drop table "public"."users";

create table "public"."clerk_users" (
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


alter table "public"."clerk_users" enable row level security;

CREATE INDEX idx_users_clerk_user_id ON public.clerk_users USING btree (clerk_user_id);

CREATE INDEX idx_users_organization_id ON public.clerk_users USING btree (organization_id);

CREATE UNIQUE INDEX users_clerk_user_id_key ON public.clerk_users USING btree (clerk_user_id);

CREATE UNIQUE INDEX users_email_key ON public.clerk_users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.clerk_users USING btree (id);

alter table "public"."clerk_users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."clerk_users" add constraint "users_clerk_user_id_key" UNIQUE using index "users_clerk_user_id_key";

alter table "public"."clerk_users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."clerk_users" add constraint "users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL not valid;

alter table "public"."clerk_users" validate constraint "users_organization_id_fkey";

alter table "public"."session_schedules" add constraint "session_schedules_session_template_id_fkey" FOREIGN KEY (session_template_id) REFERENCES session_templates(id) ON DELETE CASCADE not valid;

alter table "public"."session_schedules" validate constraint "session_schedules_session_template_id_fkey";

alter table "public"."session_templates" add constraint "session_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES clerk_users(id) not valid;

alter table "public"."session_templates" validate constraint "session_templates_created_by_fkey";

grant delete on table "public"."clerk_users" to "anon";

grant insert on table "public"."clerk_users" to "anon";

grant references on table "public"."clerk_users" to "anon";

grant select on table "public"."clerk_users" to "anon";

grant trigger on table "public"."clerk_users" to "anon";

grant truncate on table "public"."clerk_users" to "anon";

grant update on table "public"."clerk_users" to "anon";

grant delete on table "public"."clerk_users" to "authenticated";

grant insert on table "public"."clerk_users" to "authenticated";

grant references on table "public"."clerk_users" to "authenticated";

grant select on table "public"."clerk_users" to "authenticated";

grant trigger on table "public"."clerk_users" to "authenticated";

grant truncate on table "public"."clerk_users" to "authenticated";

grant update on table "public"."clerk_users" to "authenticated";

grant delete on table "public"."clerk_users" to "service_role";

grant insert on table "public"."clerk_users" to "service_role";

grant references on table "public"."clerk_users" to "service_role";

grant select on table "public"."clerk_users" to "service_role";

grant trigger on table "public"."clerk_users" to "service_role";

grant truncate on table "public"."clerk_users" to "service_role";

grant update on table "public"."clerk_users" to "service_role";

-- Drop existing policies
drop policy if exists "Enable read access for authenticated users" on "public"."clerk_users";
drop policy if exists "Enable insert for authenticated users" on "public"."clerk_users";
drop policy if exists "Enable update for users based on clerk_user_id" on "public"."clerk_users";

-- Add updated RLS policies for clerk_users table
create policy "Enable read access for authenticated users"
on "public"."clerk_users"
as permissive
for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on "public"."clerk_users"
as permissive
for insert
to authenticated
with check (
  clerk_user_id = auth.uid()::text
  and (
    organization_id is null
    or exists (
      select 1 from organizations
      where id = organization_id
    )
  )
);

create policy "Enable update for users based on clerk_user_id"
on "public"."clerk_users"
as permissive
for update
to authenticated
using (clerk_user_id = auth.uid()::text)
with check (
  clerk_user_id = auth.uid()::text
  and (
    organization_id is null
    or exists (
      select 1 from organizations
      where id = organization_id
    )
  )
);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;


