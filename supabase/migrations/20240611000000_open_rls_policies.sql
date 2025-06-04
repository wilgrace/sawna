-- Enable RLS and add permissive policies for bookings, clerk_users, and organizations

-- BOOKINGS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.bookings;

CREATE POLICY "Allow all"
  ON public.bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- CLERK_USERS
ALTER TABLE public.clerk_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.clerk_users;

CREATE POLICY "Allow all"
  ON public.clerk_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ORGANIZATIONS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.organizations;

CREATE POLICY "Allow all"
  ON public.organizations
  FOR ALL
  USING (true)
  WITH CHECK (true); 