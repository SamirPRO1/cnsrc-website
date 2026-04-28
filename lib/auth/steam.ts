const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_RE = /https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/;

export function buildSteamAuthUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params}`;
}

export async function verifySteamCallback(
  searchParams: URLSearchParams,
): Promise<string | null> {
  const verifyParams = new URLSearchParams(searchParams);
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    body: verifyParams.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const text = await res.text();
  if (!text.includes("is_valid:true")) return null;

  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const match = STEAM_ID_RE.exec(claimedId);
  return match?.[1] ?? null;
}
