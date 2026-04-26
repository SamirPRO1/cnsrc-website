import {
  listChampionshipIds,
  readChampionshipFile,
  writeChampionshipFile,
  deleteChampionshipFile,
} from "@/lib/admin/data-io";
import { ChampionshipSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  return Response.json(readChampionshipFile(id));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const body = await request.json();
  const result = ChampionshipSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  writeChampionshipFile(id, result.data);
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  deleteChampionshipFile(id);
  return new Response(null, { status: 204 });
}
