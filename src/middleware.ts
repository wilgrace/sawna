import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/booking(.*)',
  '/booking/confirmation(.*)',
  '/api/webhooks(.*)'  // Add webhook endpoints as public routes
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)'  // Make sure this matches /admin/calendar
]);

// Define role-based access control
const ROLE_ACCESS = {
  'org:super_admin': ['/admin(.*)'],
  'org:admin': ['/admin(.*)'],
  'org:user': ['/booking(.*)']
} as const;

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgRole } = await auth();
  const isSignInPage = req.nextUrl.pathname.startsWith('/sign-in');
  const isSignUpPage = req.nextUrl.pathname.startsWith('/sign-up');
  const isRootPage = req.nextUrl.pathname === '/';

  // If it's a public route, allow access
  if (isPublicRoute(req)) {
    // If user is authenticated and on sign-in/sign-up page, redirect based on role
    if (userId && (isSignInPage || isSignUpPage)) {
      if (orgRole === 'org:super_admin' || orgRole === 'org:admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/booking', req.url));
    }
    return NextResponse.next();
  }

  // For all other routes, check authentication
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Handle root page redirects for authenticated users
  if (isRootPage) {
    if (orgRole === 'org:super_admin' || orgRole === 'org:admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.redirect(new URL('/booking', req.url));
  }

  // Handle admin routes
  if (isAdminRoute(req)) {
    // Check if user has admin access
    if (orgRole !== 'org:super_admin' && orgRole !== 'org:admin') {
      // Redirect regular users to booking page
      return NextResponse.redirect(new URL('/booking', req.url));
    }
  }

  // Handle user routes
  if (req.nextUrl.pathname.startsWith('/booking')) {
    // Allow all authenticated users to access booking pages
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 