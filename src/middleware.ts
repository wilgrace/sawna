import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/booking(.*)',
  '/api/webhooks(.*)'  // Add webhook endpoints as public routes
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)'  // Make sure this matches /admin/calendar
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's a public route, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For all other routes, check authentication
  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 