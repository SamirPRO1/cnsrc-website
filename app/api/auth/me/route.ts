import { cookies } from "next/headers";
import { COOKIE_NAME, decodeSession } from "@/lib/auth/session";
import { readDriversFile } from "@/lib/admin/data-io";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return Response.json(null);

  const session = await decodeSession(token);
  if (!session) return Response.json(null);

  let driverName: string | null = null;
  let driverNumber: string | null = null;

  if (session.driverId) {
    try {
      const { drivers } = readDriversFile();
      const driver = drivers.find((d) => d.id === session.driverId);
      driverName = driver?.name ?? null;
      driverNumber = driver?.number ?? null;
    } catch {
      // ignore
    }
  }

  return Response.json({
    driverId: session.driverId,
    driverName,
    driverNumber,
    isAdmin: session.isAdmin,
  });
}
