import { redirect } from "next/navigation";
import { buildSteamAuthUrl } from "@/lib/auth/steam";

export async function GET(request: Request) {
  const base = new URL(request.url);
  const realm = `${base.protocol}//${base.host}`;
  const returnTo = `${realm}/api/auth/steam/callback`;
  const authUrl = buildSteamAuthUrl(returnTo, realm);
  redirect(authUrl);
}
