import { readTracksFile, writeTracksFile } from "@/lib/admin/data-io";
import { TrackRefSchema } from "@/lib/types";

export async function GET() {
  const { tracks } = readTracksFile();
  return Response.json(tracks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = TrackRefSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readTracksFile();
  if (data.tracks.some((t) => t.id === result.data.id)) {
    return Response.json({ error: "ID ya existe" }, { status: 409 });
  }
  data.tracks.push(result.data);
  writeTracksFile(data);
  return Response.json(result.data, { status: 201 });
}
