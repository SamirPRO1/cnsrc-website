import { readDriversFile, writeDriversFile } from "@/lib/admin/data-io";
import { DriverSchema } from "@/lib/types";

export async function GET() {
  const { drivers } = readDriversFile();
  return Response.json(drivers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = DriverSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readDriversFile();
  if (data.drivers.some((d) => d.id === result.data.id)) {
    return Response.json({ error: "ID ya existe" }, { status: 409 });
  }
  data.drivers.push(result.data);
  writeDriversFile(data);
  return Response.json(result.data, { status: 201 });
}
