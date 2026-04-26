import { readDriversFile, writeDriversFile } from "@/lib/admin/data-io";
import { TeamSchema } from "@/lib/types";

export async function GET() {
  const { teams } = readDriversFile();
  return Response.json(teams);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = TeamSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readDriversFile();
  if (data.teams.some((t) => t.id === result.data.id)) {
    return Response.json({ error: "ID ya existe" }, { status: 409 });
  }
  data.teams.push(result.data);
  writeDriversFile(data);
  return Response.json(result.data, { status: 201 });
}
