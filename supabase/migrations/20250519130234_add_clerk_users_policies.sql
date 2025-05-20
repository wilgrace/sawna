-- Drop existing policies if they exist
drop policy if exists "Enable read access for authenticated users" on "public"."clerk_users";
drop policy if exists "Enable insert for authenticated users" on "public"."clerk_users";
drop policy if exists "Enable update for users based on clerk_user_id" on "public"."clerk_users";

-- Add RLS policies for clerk_users table
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
with check (true);

create policy "Enable update for users based on clerk_user_id"
on "public"."clerk_users"
as permissive
for update
to authenticated
using (true)
with check (true);

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
