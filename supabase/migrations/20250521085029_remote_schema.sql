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

alter table "public"."bookings" add constraint "bookings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

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
  WHERE ((session_instances.id = bookings.session_instance_id) AND (session_templates.created_by = (auth.uid())::text)))));


CREATE TRIGGER on_bookings_update BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


