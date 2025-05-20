-- Create a function to insert clerk user if they don't exist
create or replace function public.ensure_clerk_user(
  p_clerk_user_id text,
  p_email text,
  p_first_name text default null,
  p_last_name text default null,
  p_organization_id uuid default null
) returns uuid
language plpgsql
security definer
as $$
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

-- Grant execute permission to authenticated users
grant execute on function public.ensure_clerk_user(text, text, text, text, uuid) to authenticated; 