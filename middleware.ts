import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  console.log("isLoggedIn", isLoggedIn);

  // Public routes (do not require auth)
  const publicPaths = ["/signin", "/signout", "/offline"];
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    // If already signed in and accessing auth page, redirect to home
    if (isLoggedIn && (pathname === "/signin" || pathname === "/signout")) {
      const homeUrl = new URL("/", nextUrl.origin);
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  // Protected routes (require login)
  if (!isLoggedIn) {
    const signInUrl = new URL("/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except:
    // - API routes
    // - _next static/image assets
    // - metadata files
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
