import {
  listChampionshipIds,
  readChampionshipFile,
  writeChampionshipFile,
} from "@/lib/admin/data-io";
import { RoundSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> },
) {
  const { id, roundId } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const champ = readChampionshipFile(id);
  const round = champ.rounds.find((r) => r.id === roundId);
  if (!round) return Response.json({ error: "Ronda no encontrada" }, { status: 404 });
  return Response.json(round);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> },
) {
  const { id, roundId } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const body = await request.json();
  const result = RoundSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const champ = readChampionshipFile(id);
  const idx = champ.rounds.findIndex((r) => r.id === roundId);
  if (idx === -1) return Response.json({ error: "Ronda no encontrada" }, { status: 404 });
  champ.rounds[idx] = result.data;
  writeChampionshipFile(id, champ);
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; roundId: string }> },
) {
  const { id, roundId } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const champ = readChampionshipFile(id);
  const idx = champ.rounds.findIndex((r) => r.id === roundId);
  if (idx === -1) return Response.json({ error: "Ronda no encontrada" }, { status: 404 });
  champ.rounds.splice(idx, 1);
  writeChampionshipFile(id, champ);
  return new Response(null, { status: 204 });
}
