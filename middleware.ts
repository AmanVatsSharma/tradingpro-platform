// middleware.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

/**
 * An array of routes that are accessible to the public.
 * These routes do not require authentication.
 * @type {string[]}
 */
const publicRoutes = [
  "/",
  "/auth/error",
  "/api/graphql",
  "/api/kyc",
];

/**
 * An array of routes that are used for authentication.
 * Logged-in users will be redirected from these routes to a protected page (e.g., dashboard).
 * @type {string[]}
 */
const authRoutes = [
  "/auth/login",
  // Add other auth routes like /auth/register if you have them
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = publicRoutes.some(route =>
    nextUrl.pathname === route || (route.endsWith('/') && nextUrl.pathname.startsWith(route))
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // 1. Allow NextAuth specific API routes to always pass through
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 2. If the user is logged in and tries to access an auth route (e.g., login page),
  //    redirect them to the dashboard.
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl)); // Adjust "/dashboard" if your main page is different
  }

  // 3. If the user is NOT logged in and is trying to access a protected route,
  //    redirect them to the login page.
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // --- Optional: KYC Check ---
  // This logic redirects a logged-in user to the KYC page if their KYC is not complete.
  // This requires adding `kycStatus` to your session token in the `auth.ts` callbacks.

  // if (isLoggedIn && req.auth.user?.kycStatus !== 'VERIFIED' && nextUrl.pathname !== '/kyc') {

  // Assuming `req.auth.user.kycStatus` is available in your session
  // and you have a page at `/kyc`.
  // return NextResponse.redirect(new URL('/kyc', nextUrl));
  // }

  // If none of the above, allow the request to proceed
  return NextResponse.next();
});

// This config specifies which routes the middleware should be invoked on.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|vercel.svg|next.svg).*)"],
};