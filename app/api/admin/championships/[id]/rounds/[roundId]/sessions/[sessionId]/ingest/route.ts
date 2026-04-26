import {
  listChampionshipIds,
  readChampionshipFile,
  writeChampionshipFile,
  readDriversFile,
} from "@/lib/admin/data-io";
import {
  readRaceFile,
  readGuidMap,
  readClassUuidMap,
  sanitizeFilename,
} from "@/lib/admin/raceFilesIo";
import {
  ingestRaceFile,
  type RaceFile,
  type IngestOptions,
} from "@/lib/admin/ingestRaceData";

interface IngestBody {
  filename?: string;
  /** if true, also clear existing laps/results/incidents (used for "Vaciar" / clear action) */
  clear?: boolean;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; roundId: string; sessionId: string }> },
) {
  const { id, roundId, sessionId } = await params;
  if (!listChampionshipIds().includes(id)) {
    return Response.json({ error: "Campeonato no encontrado" }, { status: 404 });
  }

  let body: IngestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const champ = readChampionshipFile(id);
  const round = champ.rounds.find((r) => r.id === roundId);
  if (!round) return Response.json({ error: "Ronda no encontrada" }, { status: 404 });
  const session = round.sessions.find((s) => s.id === sessionId);
  if (!session)
    return Response.json({ error: "Sesión no encontrada" }, { status: 404 });

  // Clear action: drop laps/results/incidents + raceDataFile
  if (body.clear) {
    session.laps = [];
    session.results = [];
    session.incidents = [];
    session.conditions = { airTemp: 0, trackTemp: 0, weather: "—" };
    delete (session as { raceDataFile?: string }).raceDataFile;
    writeChampionshipFile(id, champ);
    return Response.json({ cleared: true });
  }

  const filename = body.filename ? sanitizeFilename(body.filename) : null;
  if (!filename) {
    return Response.json({ error: "Archivo no especificado" }, { status: 400 });
  }

  let race: RaceFile;
  try {
    race = readRaceFile(filename) as RaceFile;
  } catch {
    return Response.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const guidMap = readGuidMap();
  const classMap = readClassUuidMap();

  // Build name → teamId lookup from drivers.json teams
  const driversFile = readDriversFile();
  const teamNameToId: Record<string, string> = {};
  for (const t of driversFile.teams) {
    teamNameToId[t.name.toLowerCase()] = t.id;
  }
  // Build driverId → teamId fallback
  const driverIdToTeam = new Map<string, string>();
  for (const d of driversFile.drivers) {
    driverIdToTeam.set(d.id, d.teamId);
  }

  const isRace2 = session.subLabel?.toLowerCase().includes("r2") ?? false;

  const opts: IngestOptions = {
    guidMap,
    classMap,
    teamNameToId,
    teamForDriver: (driverId) => driverIdToTeam.get(driverId) ?? "",
    pointsTable: champ.pointsTable,
    isRace2,
  };

  const ingested = ingestRaceFile(race, opts);

  // Compute skipped drivers (in race but not in GUID map)
  const SPECTATOR = "00000000-0000-0000-0000-000000000000";
  const skippedSet = new Set<string>();
  for (const car of race.Cars) {
    if (car.ClassID === SPECTATOR) continue;
    if (guidMap[car.Driver.Guid]) continue;
    skippedSet.add(`${car.Driver.Name} (${car.Driver.Guid})`);
  }
  const skipped = [...skippedSet];

  // Apply
  session.laps = ingested.laps;
  session.results = ingested.results;
  session.incidents = ingested.incidents;
  session.conditions = ingested.conditions;
  session.raceDataFile = filename;
  if (round.status === "upcoming") round.status = "done";
  if (session.status === "upcoming") session.status = "done";

  writeChampionshipFile(id, champ);

  return Response.json({
    filename,
    lapsIngested: ingested.laps.length,
    driversIngested: new Set(ingested.laps.map((l) => l.driverId)).size,
    resultsIngested: ingested.results.length,
    incidentsIngested: ingested.incidents.length,
    skippedDrivers: skipped,
  });
}
