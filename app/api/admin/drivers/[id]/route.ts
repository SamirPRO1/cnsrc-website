import { readDriversFile, writeDriversFile } from "@/lib/admin/data-io";
import { DriverSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { drivers } = readDriversFile();
  const driver = drivers.find((d) => d.id === id);
  if (!driver) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json(driver);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = DriverSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readDriversFile();
  const idx = data.drivers.findIndex((d) => d.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.drivers[idx] = result.data;
  writeDriversFile(data);
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = readDriversFile();
  const idx = data.drivers.findIndex((d) => d.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.drivers.splice(idx, 1);
  writeDriversFile(data);
  return new Response(null, { status: 204 });
}
