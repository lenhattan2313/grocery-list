import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Define public routes as a Set for O(1) lookup performance
const PUBLIC_ROUTES = new Set(["/signin", "/signout", "/offline"]);

// Define auth routes that should redirect logged-in users
const AUTH_ROUTES = new Set(["/signin", "/signout"]);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Early return for public routes - no authentication check needed
  if (PUBLIC_ROUTES.has(pathname)) {
    // If user is logged in and trying to access auth pages, redirect to dashboard
    if (isLoggedIn && AUTH_ROUTES.has(pathname)) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected route
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    // Preserve the original URL as a redirect parameter for better UX
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

// Optimized matcher pattern - more specific and efficient
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.ico).*)"],
};
