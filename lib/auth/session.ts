import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  guid: string;
  driverId: string | null;
  isAdmin: boolean;
}

export const COOKIE_NAME = "cnsrc_session";
const SESSION_TTL_DAYS = 14;

function getEncodedSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export async function encodeSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getEncodedSecret());
}

export async function decodeSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ["HS256"],
    });
    const { guid, driverId, isAdmin } = payload as Record<string, unknown>;
    if (typeof guid !== "string") return null;
    return {
      guid,
      driverId: typeof driverId === "string" ? driverId : null,
      isAdmin: isAdmin === true,
    };
  } catch {
    return null;
  }
}
