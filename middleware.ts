import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, decodeSession } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  const session = cookieValue ? await decodeSession(cookieValue) : null;

  // ── API admin routes: full admin only ────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Profile API: any driver ──────────────────────────────────────
  if (pathname.startsWith("/api/profile")) {
    if (!session?.driverId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Admin pages ──────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // /admin/profile: requires driverId
    if (pathname === "/admin/profile") {
      if (!session.driverId) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // All other /admin/* pages: full admin only
    if (!session.isAdmin) {
      // Non-admin drivers are redirected to their profile
      if (session.driverId) {
        return NextResponse.redirect(new URL("/admin/profile", request.url));
      }
      return NextResponse.redirect(new URL("/login?error=not-authorized", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/profile/:path*"],
};
