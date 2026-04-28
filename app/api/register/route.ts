import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { encodeSession, COOKIE_NAME } from "@/lib/auth/session";
import { readDriversFile, writeDriversFile, readDriverGuidsFile } from "@/lib/admin/data-io";
import type { Driver } from "@/lib/types";

const PENDING_COOKIE = "cnsrc_pending";
const PUBLIC_DRIVERS = path.join(process.cwd(), "public", "drivers");
const DATA_DIR = path.join(process.cwd(), "data");

function generateDriverId(drivers: Driver[]): string {
  const nums = drivers
    .map((d) => parseInt(d.id.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `d${String(next).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const guid = cookieStore.get(PENDING_COOKIE)?.value;

  if (!guid) {
    return Response.json({ error: "Sesión de registro expirada. Inicia sesión de nuevo con Steam." }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Se esperaba multipart/form-data" }, { status: 400 });
  }

  const form = await request.formData();
  const name = (form.get("name") as string | null)?.trim();
  const numberRaw = form.get("number") as string | null;
  const pictureFile = form.get("picture");

  if (!name || name.length < 2) {
    return Response.json({ error: "El nombre debe tener al menos 2 caracteres." }, { status: 400 });
  }

  const numberInt = parseInt(numberRaw ?? "", 10);
  if (isNaN(numberInt) || numberInt < 1 || numberInt > 999) {
    return Response.json({ error: "El número debe estar entre 1 y 999." }, { status: 400 });
  }
  const numberStr = String(numberInt);

  const data = readDriversFile();

  if (data.drivers.some((d) => d.number === numberStr)) {
    return Response.json({ error: `El número ${numberStr} ya está en uso. Elige otro.` }, { status: 409 });
  }

  // Check GUID not already registered (race condition guard)
  const guidsMap = readDriverGuidsFile();
  if (guidsMap[guid]) {
    return Response.json({ error: "Esta cuenta de Steam ya está registrada." }, { status: 409 });
  }

  let picturePath: string | undefined;
  if (pictureFile instanceof File && pictureFile.size > 0) {
    const ext = pictureFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) {
      return Response.json({ error: "Formato de imagen no soportado." }, { status: 400 });
    }
    const driverIdTemp = generateDriverId(data.drivers);
    const filename = `${driverIdTemp}.${ext}`;
    fs.mkdirSync(PUBLIC_DRIVERS, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_DRIVERS, filename), Buffer.from(await pictureFile.arrayBuffer()));
    picturePath = `/drivers/${filename}`;
  }

  const driverId = generateDriverId(data.drivers);
  const newDriver: Driver = {
    id: driverId,
    name,
    number: numberStr,
    country: "CUB",
    teamId: "",
    license: "C",
    joined: String(new Date().getFullYear()),
    guids: [guid],
    ...(picturePath ? { picture: picturePath } : {}),
  };

  data.drivers.push(newDriver);
  writeDriversFile(data);

  // Update driver-guids.json
  guidsMap[guid] = driverId;
  fs.writeFileSync(
    path.join(DATA_DIR, "driver-guids.json"),
    JSON.stringify(guidsMap, null, 2),
    "utf-8",
  );

  // Set full session, clear pending cookie
  const isAdmin = (process.env.ADMIN_GUIDS ?? "")
    .split(",")
    .map((g) => g.trim())
    .includes(guid);

  const token = await encodeSession({ guid, driverId, isAdmin });
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
  cookieStore.delete(PENDING_COOKIE);

  return Response.json({ driverId }, { status: 201 });
}
