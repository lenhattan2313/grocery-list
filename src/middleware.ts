import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth"; // your next-auth auth helper
import type { NextRequest } from "next/server";

export default auth((req: NextRequest) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth;

  // Public pages (no auth required)
  const publicPaths = ["/signin", "/signout", "/offline"];
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    // If already signed in and accessing signin/signout, redirect to home
    if (isLoggedIn && (pathname === "/signin" || pathname === "/signout")) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Protected pages (requires login)
  if (!isLoggedIn) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Default: allow access
  return NextResponse.next();
});
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
