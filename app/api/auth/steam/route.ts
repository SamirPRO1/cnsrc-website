import { redirect } from "next/navigation";
import { buildSteamAuthUrl } from "@/lib/auth/steam";

export async function GET(request: Request) {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const realm = `${proto}://${host}`;
  const returnTo = `${realm}/api/auth/steam/callback`;
  const authUrl = buildSteamAuthUrl(returnTo, realm);
  redirect(authUrl);
}
