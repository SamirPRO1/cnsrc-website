import {
  listChampionshipIds,
  readChampionshipFile,
  writeChampionshipFile,
} from "@/lib/admin/data-io";
import { RoundSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const champ = readChampionshipFile(id);
  return Response.json(champ.rounds);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const body = await request.json();
  const result = RoundSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const champ = readChampionshipFile(id);
  if (champ.rounds.some((r) => r.id === result.data.id)) {
    return Response.json({ error: "Round ID ya existe" }, { status: 409 });
  }
  champ.rounds.push(result.data);
  writeChampionshipFile(id, champ);
  return Response.json(result.data, { status: 201 });
}
