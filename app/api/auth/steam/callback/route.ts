import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySteamCallback } from "@/lib/auth/steam";
import { encodeSession, COOKIE_NAME } from "@/lib/auth/session";
import { readDriverGuidsFile } from "@/lib/admin/data-io";

const PENDING_COOKIE = "cnsrc_pending";
const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds

function getAdminGuids(): Set<string> {
  const raw = process.env.ADMIN_GUIDS ?? "";
  return new Set(raw.split(",").map((g) => g.trim()).filter(Boolean));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const guid = await verifySteamCallback(url.searchParams);

  if (!guid) {
    redirect("/login?error=steam-failed");
  }

  const adminGuids = getAdminGuids();
  const isAdmin = adminGuids.has(guid);

  let driverId: string | null = null;
  try {
    const guidsMap = readDriverGuidsFile();
    driverId = guidsMap[guid] ?? null;
  } catch {
    // driver-guids.json missing or malformed — treat as no mapping
  }

  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  // Known driver or admin — create full session immediately
  if (driverId || isAdmin) {
    const token = await encodeSession({ guid, driverId, isAdmin });
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
    redirect(isAdmin && !driverId ? "/admin" : "/admin/profile");
  }

  // New user — store GUID in a short-lived pending cookie, redirect to registration
  cookieStore.set(PENDING_COOKIE, guid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes to complete registration
    path: "/",
  });
  redirect("/register");
}
