import { deleteRaceFile, sanitizeFilename } from "@/lib/admin/raceFilesIo";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename: raw } = await params;
  const filename = sanitizeFilename(raw);
  if (!filename) {
    return Response.json({ error: "Nombre inválido" }, { status: 400 });
  }
  deleteRaceFile(filename);
  return new Response(null, { status: 204 });
}
