import { readTracksFile, writeTracksFile } from "@/lib/admin/data-io";
import { TrackRefSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { tracks } = readTracksFile();
  const track = tracks.find((t) => t.id === id);
  if (!track) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json(track);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = TrackRefSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readTracksFile();
  const idx = data.tracks.findIndex((t) => t.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.tracks[idx] = result.data;
  writeTracksFile(data);
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = readTracksFile();
  const idx = data.tracks.findIndex((t) => t.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.tracks.splice(idx, 1);
  writeTracksFile(data);
  return new Response(null, { status: 204 });
}
