import { readDriversFile, writeDriversFile } from "@/lib/admin/data-io";
import { TeamSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { teams } = readDriversFile();
  const team = teams.find((t) => t.id === id);
  if (!team) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json(team);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = TeamSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readDriversFile();
  const idx = data.teams.findIndex((t) => t.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.teams[idx] = result.data;
  writeDriversFile(data);
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = readDriversFile();
  const idx = data.teams.findIndex((t) => t.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.teams.splice(idx, 1);
  writeDriversFile(data);
  return new Response(null, { status: 204 });
}
