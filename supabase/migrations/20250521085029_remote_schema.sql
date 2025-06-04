-- Function to update the updated_at column on row update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure clerk user exists
CREATE OR REPLACE FUNCTION public.ensure_clerk_user(
  p_clerk_user_id text,
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_default_org_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id
  FROM public.clerk_users
  WHERE clerk_user_id = p_clerk_user_id;

  -- If user doesn't exist, create them
  IF v_user_id IS NULL THEN
    -- Get the default organization ID
    SELECT id INTO v_default_org_id
    FROM public.organizations
    WHERE name = 'Default Organization';

    -- If no default organization exists, create one
    IF v_default_org_id IS NULL THEN
      INSERT INTO public.organizations (name)
      VALUES ('Default Organization')
      RETURNING id INTO v_default_org_id;
    END IF;

    -- Create the user
    INSERT INTO public.clerk_users (
      clerk_user_id,
      email,
      first_name,
      last_name,
      organization_id
    )
    VALUES (
      p_clerk_user_id,
      p_email,
      p_first_name,
      p_last_name,
      v_default_org_id
    )
    RETURNING id INTO v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

-- 1. Create referenced tables first
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

CREATE TABLE IF NOT EXISTS "public"."session_templates" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "sauna_id" uuid,
    "name" text NOT NULL,
    "description" text,
    "capacity" integer NOT NULL,
    "duration_minutes" integer NOT NULL,
    "is_open" boolean DEFAULT true NOT NULL,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "one_off_start_time" timestamp with time zone,
    "one_off_date" date,
    "recurrence_start_date" date,
    "recurrence_end_date" date,
    "created_by" uuid NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "session_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."clerk_users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."session_instances" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" uuid NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" text NOT NULL DEFAULT 'scheduled',
    "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "session_instances_pkey" PRIMARY KEY ("id")
);

-- 2. Now create bookings table and all related constraints, indexes, grants, and policies

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

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);
CREATE UNIQUE INDEX bookings_session_instance_id_user_id_key ON public.bookings USING btree (session_instance_id, user_id);
CREATE INDEX idx_bookings_session_instance_id ON public.bookings USING btree (session_instance_id);
CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";
alter table "public"."bookings" add constraint "bookings_session_instance_id_fkey" FOREIGN KEY (session_instance_id) REFERENCES session_instances(id) ON DELETE CASCADE not valid;
alter table "public"."bookings" validate constraint "bookings_session_instance_id_fkey";
alter table "public"."bookings" add constraint "bookings_session_instance_id_user_id_key" UNIQUE using index "bookings_session_instance_id_user_id_key";
alter table "public"."bookings" add constraint "bookings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES clerk_users(id) ON DELETE CASCADE not valid;
alter table "public"."bookings" validate constraint "bookings_user_id_fkey";

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

create policy "Admins can delete bookings for their session instances"
on "public"."bookings"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (session_instances
     JOIN session_templates ON ((session_templates.id = session_instances.template_id)))
  WHERE ((session_instances.id = bookings.session_instance_id) AND (session_templates.created_by IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  ))))));

create policy "Users can view their own bookings"
on "public"."bookings"
as permissive
for select
to authenticated
using (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

create policy "Users can create their own bookings"
on "public"."bookings"
as permissive
for insert
to authenticated
with check (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

create policy "Users can update their own bookings"
on "public"."bookings"
as permissive
for update
to authenticated
using (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
)
with check (
  user_id IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  )
);

CREATE TRIGGER on_bookings_update BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

create policy "Admins can manage instances of their own templates"
on "public"."session_instances"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM session_templates
  WHERE ((session_templates.id = session_instances.template_id) AND (session_templates.created_by IN (
    SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
  ))))));

create policy "Enable insert for authenticated users"
on "public"."session_templates"
as permissive
for insert
to authenticated
with check ((created_by IN (
  SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
)));

create policy "Enable update for users based on created_by"
on "public"."session_templates"
as permissive
for update
to authenticated
using ((created_by IN (
  SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
)))
with check ((created_by IN (
  SELECT id FROM clerk_users WHERE clerk_user_id = auth.uid()::text
)));


