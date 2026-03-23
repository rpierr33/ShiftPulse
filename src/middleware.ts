import { auth } from "@/auth";
import { NextResponse } from "next/server";

const roleRouteMap: Record<string, string> = {
  WORKER: "/worker",
  COMPANY: "/company",
  CLIENT: "/client",
  ADMIN: "/admin",
};

const roleDashboards: Record<string, string> = {
  WORKER: "/worker/dashboard",
  COMPANY: "/company/dashboard",
  CLIENT: "/client/dashboard",
  ADMIN: "/admin/dashboard",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as { role?: string } | undefined;
  const isLoggedIn = !!user;

  // Public routes - allow always
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/marketplace") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/resend-verification");

  if (isPublic) return NextResponse.next();

  // Onboarding route - allow any logged in user
  if (pathname.startsWith("/onboarding")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Messages route - allow any logged in user (shared between roles)
  if (pathname.startsWith("/messages")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user?.role;
  if (!role) return NextResponse.next();

  // Check if user is accessing a role-specific route they don't own
  const protectedPrefixes = ["/worker", "/company", "/client", "/admin"];
  for (const prefix of protectedPrefixes) {
    if (pathname.startsWith(prefix)) {
      const allowedPrefix = roleRouteMap[role];
      if (allowedPrefix && prefix !== allowedPrefix) {
        // Redirect to their own dashboard instead of 403
        const redirectUrl = new URL(roleDashboards[role] || "/", req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // API export routes - let the handler check auth
  if (pathname.startsWith("/api/exports")) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
