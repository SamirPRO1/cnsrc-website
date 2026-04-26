import {
  listChampionshipIds,
  readChampionshipFile,
  writeChampionshipFile,
} from "@/lib/admin/data-io";
import { ChampionshipSchema } from "@/lib/types";

export async function GET() {
  const ids = listChampionshipIds();
  const champs = ids.map((id) => {
    const c = readChampionshipFile(id);
    return { id: c.id, name: c.name, season: c.season, year: c.year, status: c.status, rounds: c.rounds.length };
  });
  return Response.json(champs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = ChampionshipSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const ids = listChampionshipIds();
  if (ids.includes(result.data.id)) {
    return Response.json({ error: "ID ya existe" }, { status: 409 });
  }
  writeChampionshipFile(result.data.id, result.data);
  return Response.json(result.data, { status: 201 });
}
