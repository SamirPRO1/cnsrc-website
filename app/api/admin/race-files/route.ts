import {
  listRaceFiles,
  writeRaceFile,
  sanitizeFilename,
} from "@/lib/admin/raceFilesIo";

export async function GET() {
  return Response.json(listRaceFiles());
}

/**
 * POST body: { filename: string, content: string (JSON text) }
 * Writes content to data/races/<filename>.
 */
export async function POST(request: Request) {
  let body: { filename?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const filename = body.filename ? sanitizeFilename(body.filename) : null;
  if (!filename) {
    return Response.json(
      { error: "Nombre de archivo inválido (use solo letras, números, ., _, - y termine en .json)" },
      { status: 400 },
    );
  }
  if (!body.content || typeof body.content !== "string") {
    return Response.json({ error: "Contenido requerido" }, { status: 400 });
  }

  try {
    writeRaceFile(filename, body.content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al escribir";
    return Response.json({ error: `JSON inválido: ${msg}` }, { status: 400 });
  }

  return Response.json({ filename }, { status: 201 });
}
