import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { COOKIE_NAME, decodeSession } from "@/lib/auth/session";
import { readDriversFile, writeDriversFile } from "@/lib/admin/data-io";

const PUBLIC_DRIVERS = path.join(process.cwd(), "public", "drivers");

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.driverId) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let description: string | undefined;
  let picturePath: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();

    const desc = form.get("description");
    if (typeof desc === "string") description = desc;

    const file = form.get("picture");
    if (file instanceof File && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
        return Response.json({ error: "Formato de imagen no soportado" }, { status: 400 });
      }
      const filename = `${session.driverId}.${ext}`;
      const dest = path.join(PUBLIC_DRIVERS, filename);
      fs.mkdirSync(PUBLIC_DRIVERS, { recursive: true });
      const buf = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(dest, buf);
      picturePath = `/drivers/${filename}`;
    }
  } else {
    const body = await request.json();
    if (typeof body.description === "string") description = body.description;
  }

  const data = readDriversFile();
  const idx = data.drivers.findIndex((d) => d.id === session.driverId);
  if (idx === -1) {
    return Response.json({ error: "Piloto no encontrado" }, { status: 404 });
  }

  if (description !== undefined) data.drivers[idx].description = description;
  if (picturePath !== undefined) data.drivers[idx].picture = picturePath;

  writeDriversFile(data);
  return Response.json(data.drivers[idx]);
}
