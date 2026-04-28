import { cookies } from "next/headers";
import { COOKIE_NAME, decodeSession } from "@/lib/auth/session";
import { readDriversFile } from "@/lib/admin/data-io";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = token ? await decodeSession(token) : null;

  if (!session?.driverId) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { drivers } = readDriversFile();
  const driver = drivers.find((d) => d.id === session.driverId);
  if (!driver) {
    return Response.json({ error: "Piloto no encontrado" }, { status: 404 });
  }

  const { id, name, picture, description } = driver;
  return Response.json({ id, name, picture, description });
}
