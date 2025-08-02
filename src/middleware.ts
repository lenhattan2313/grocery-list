import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth;
  console.log("isLoggedIn", isLoggedIn);

  // Public pages (no auth required)
  const publicPaths = ["/signin", "/signout", "/offline"];
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    // If already signed in and accessing signin/signout, redirect to home
    if (isLoggedIn && (pathname === "/signin" || pathname === "/signout")) {
      return NextResponse.redirect("/");
    }
    return NextResponse.next();
  }

  // Protected pages (requires login)
  if (!isLoggedIn) {
    const signInUrl = `/signin?callbackUrl=${encodeURIComponent(pathname)}`;
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
