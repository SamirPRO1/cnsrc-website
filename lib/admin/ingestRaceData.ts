import type {
  Lap,
  Result,
  Incident,
  Conditions,
  Session,
  PointsTable,
} from "@/lib/types";

/* ── AC race JSON shapes (subset we need) ────────────────────── */

interface RaceLap {
  CarId: number;
  DriverGuid: string;
  DriverName: string;
  LapTime: number;
  Sectors: number[];
  Cuts: number;
  Tyre: string;
  Timestamp: number;
  ClassID: string;
  Conditions?: {
    Ambient: number;
    Road: number;
    Grip?: number;
    WindSpeed?: number;
    WindDirection?: number;
    RainIntensity?: number;
  };
}

interface RaceCar {
  CarId: number;
  Driver: { Guid: string; Name: string; Team?: string; ClassID: string };
  ClassID: string;
}

interface RaceResult {
  CarId: number;
  DriverGuid: string;
  DriverName: string;
  ClassID: string;
  GridPosition: number;
  BestLap: number;
  TotalTime: number;
  NumLaps: number;
  Disqualified: boolean;
  HasPenalty?: boolean;
  PenaltyTime?: number;
  LapPenalty?: number;
}

interface RaceEvent {
  Type: string; // "COLLISION_WITH_CAR" | "COLLISION_WITH_ENV"
  CarId: number;
  Driver: { Guid: string; Name: string };
  OtherCarId?: number;
  OtherDriver?: { Guid: string; Name: string };
  Timestamp: number;
  AfterSessionEnd?: boolean;
}

export interface RaceFile {
  Cars: RaceCar[];
  Laps: RaceLap[];
  Result: RaceResult[];
  Events?: RaceEvent[];
  TrackName: string;
  ChampionshipID: string;
  RaceWeekendID: string;
  EventName: string;
  SessionConfig: { laps: number; session_type?: number };
  Type: "RACE" | "QUALIFY" | "PRACTICE";
  Date: string;
}

/* ── Time formatting ─────────────────────────────────────────── */

function msToLapString(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0.000";
  const mins = Math.floor(ms / 60_000);
  const sec = (ms - mins * 60_000) / 1000;
  if (mins === 0) return sec.toFixed(3);
  return `${mins}:${sec.toFixed(3).padStart(6, "0")}`;
}

function formatGap(deltaMs: number): string {
  if (deltaMs <= 0) return "—";
  if (deltaMs < 60_000) return `+${(deltaMs / 1000).toFixed(3)}`;
  const mins = Math.floor(deltaMs / 60_000);
  const sec = (deltaMs - mins * 60_000) / 1000;
  return `+${mins}:${sec.toFixed(3).padStart(6, "0")}`;
}

const TYRE_MAP: Record<string, "S" | "M" | "H" | "I" | "W"> = {
  S: "S", M: "M", H: "H", I: "I", W: "W",
  Soft: "S", Medium: "M", Hard: "H", Inter: "I", Wet: "W",
};

const SPECTATOR_CLASS = "00000000-0000-0000-0000-000000000000";

/* ── Inputs ──────────────────────────────────────────────────── */

export interface DriverGuidMap {
  /** Steam GUID → domain driverId (e.g. "76561199012707732" → "d02") */
  [guid: string]: string;
}

export interface ClassUuidMap {
  /** AC class UUID → normalized class id (e.g. "...02" → "indycar") */
  [uuid: string]: string;
}

export interface IngestOptions {
  guidMap: DriverGuidMap;
  classMap: ClassUuidMap;
  /** Looks up a team ID for a given GUID (driver). Optional. */
  teamForDriver?: (driverId: string) => string;
  /** Maps a free-text team name from the race file → registered teamId. Optional. */
  teamNameToId?: Record<string, string>;
  /** Championship points table; if absent, points will all be 0. */
  pointsTable?: PointsTable;
  /** True if this is the second race of the weekend (R2 — uses 1.5× points). */
  isRace2?: boolean;
}

export interface IngestedSessionData {
  laps: Lap[];
  results: Result[];
  incidents: Incident[];
  conditions: Conditions;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function pickConditions(race: RaceFile): Conditions {
  const first = race.Laps.find((l) => l.Conditions);
  if (!first?.Conditions) {
    return { airTemp: 0, trackTemp: 0, weather: "—" };
  }
  const c = first.Conditions;
  const wet = (c.RainIntensity ?? 0) > 0.05;
  const weather = wet ? "Lluvia" : "Despejado";
  return {
    airTemp: Math.round(c.Ambient),
    trackTemp: Math.round(c.Road),
    weather,
    windKph: typeof c.WindSpeed === "number" ? Math.round(c.WindSpeed) : undefined,
  };
}

/** Resolve teamId for a given car: prefer name-mapped team, fallback to driver registry lookup. */
function resolveTeamId(
  raceCar: RaceCar,
  driverId: string,
  opts: IngestOptions,
): string {
  const rawTeamName = raceCar.Driver.Team?.trim();
  if (rawTeamName && opts.teamNameToId?.[rawTeamName.toLowerCase()]) {
    return opts.teamNameToId[rawTeamName.toLowerCase()];
  }
  if (opts.teamForDriver) {
    return opts.teamForDriver(driverId);
  }
  return "";
}

function pointsForPosition(
  pos: number,
  isRace2: boolean,
  isFastestLap: boolean,
  table?: PointsTable,
): number {
  if (!table) return 0;
  const arr = isRace2 ? table.r2 : table.r1;
  const base = arr[pos - 1] ?? 0;
  const flBonus = isFastestLap ? (isRace2 ? table.fastestLapR2 : table.fastestLapR1) : 0;
  return base + flBonus;
}

/* ── Lap ingestion ───────────────────────────────────────────── */

export function ingestRaceLaps(
  race: RaceFile,
  guidMap: DriverGuidMap,
): Lap[] {
  // Group laps per CarId, sorted by timestamp
  const lapsByCar = new Map<number, RaceLap[]>();
  for (const l of race.Laps) {
    if (l.ClassID === SPECTATOR_CLASS) continue;
    const arr = lapsByCar.get(l.CarId);
    if (arr) arr.push(l);
    else lapsByCar.set(l.CarId, [l]);
  }
  for (const arr of lapsByCar.values()) {
    arr.sort((a, b) => a.Timestamp - b.Timestamp);
  }

  const out: Lap[] = [];
  for (const [carId, arr] of lapsByCar) {
    const car = race.Cars.find((c) => c.CarId === carId);
    if (!car) continue;
    const driverId = guidMap[car.Driver.Guid];
    if (!driverId) continue;

    arr.forEach((rl, idx) => {
      const sectors = rl.Sectors.length === 3 ? rl.Sectors : [0, 0, 0];
      out.push({
        driverId,
        lapNo: idx + 1,
        time: msToLapString(rl.LapTime),
        sectors: [
          msToLapString(sectors[0]),
          msToLapString(sectors[1]),
          msToLapString(sectors[2]),
        ],
        compound: TYRE_MAP[rl.Tyre] ?? "M",
        cut: rl.Cuts > 0,
        timestamp: rl.Timestamp,
      });
    });
  }
  return out;
}

/* ── Results ingestion ───────────────────────────────────────── */

export function ingestRaceResults(
  race: RaceFile,
  opts: IngestOptions,
): Result[] {
  const isRace = race.Type === "RACE";
  const isQualifying = race.Type === "QUALIFY";
  const { guidMap, classMap, pointsTable, isRace2 = false } = opts;

  // Group race results by class
  const byClass = new Map<
    string,
    Array<RaceResult & { carRef: RaceCar; driverId: string; teamId: string }>
  >();

  for (const r of race.Result) {
    if (r.ClassID === SPECTATOR_CLASS) continue;
    const car = race.Cars.find((c) => c.CarId === r.CarId);
    if (!car) continue;
    const driverId = guidMap[car.Driver.Guid];
    if (!driverId) continue;

    const normClass = classMap[r.ClassID] ?? r.ClassID;
    const teamId = resolveTeamId(car, driverId, opts);

    const arr = byClass.get(normClass);
    const enriched = { ...r, carRef: car, driverId, teamId };
    if (arr) arr.push(enriched);
    else byClass.set(normClass, [enriched]);
  }

  const out: Result[] = [];

  for (const [classId, entries] of byClass) {
    if (isQualifying) {
      // For qualifying: sort by best lap ascending (no lap time → end)
      entries.sort((a, b) => {
        if (a.BestLap <= 0) return 1;
        if (b.BestLap <= 0) return -1;
        return a.BestLap - b.BestLap;
      });
      entries.forEach((e, i) => {
        const pos = i + 1;
        const gap =
          i === 0
            ? "—"
            : e.BestLap > 0 && entries[0].BestLap > 0
            ? formatGap(e.BestLap - entries[0].BestLap)
            : "--";
        out.push({
          driverId: e.driverId,
          teamId: e.teamId,
          classId,
          pos,
          gridPos: pos,
          bestLap: msToLapString(e.BestLap),
          gap,
          points: 0,
          status: "finished",
        });
      });
      continue;
    }

    // Race: AC race files already provide Result[] in finishing order.
    // We trust their ordering within the file (matches what was on the broadcast).
    // But we re-sort to be safe by (NumLaps desc, TotalTime asc).
    entries.sort((a, b) => {
      if (b.NumLaps !== a.NumLaps) return b.NumLaps - a.NumLaps;
      return (a.TotalTime || Infinity) - (b.TotalTime || Infinity);
    });

    const winnerLaps = entries[0]?.NumLaps ?? 0;
    const winnerTime = entries[0]?.TotalTime ?? 0;

    // Fastest valid lap in class (BestLap from race result; cuts ignored at server level)
    const fastest = [...entries]
      .filter((e) => e.BestLap > 0)
      .sort((a, b) => a.BestLap - b.BestLap)[0];

    entries.forEach((e, i) => {
      const pos = i + 1;
      const isDnf =
        e.Disqualified || (winnerLaps > 1 && e.NumLaps < winnerLaps * 0.6);
      const isFl = !!fastest && e.driverId === fastest.driverId;

      let gap: string;
      if (i === 0) gap = "—";
      else if (e.NumLaps < winnerLaps) {
        const lapsDiff = winnerLaps - e.NumLaps;
        gap = `+${lapsDiff} Vlt${lapsDiff !== 1 ? "s" : ""}`;
      } else gap = formatGap(e.TotalTime - winnerTime);

      const points =
        isRace || isQualifying
          ? isDnf
            ? 0
            : pointsForPosition(pos, isRace2, isFl, pointsTable)
          : 0;

      out.push({
        driverId: e.driverId,
        teamId: e.teamId,
        classId,
        pos,
        gridPos: e.GridPosition || pos,
        bestLap: msToLapString(e.BestLap),
        gap,
        points,
        status: e.Disqualified ? "dsq" : isDnf ? "dnf" : "finished",
      });
    });
  }

  return out;
}

/* ── Incidents ingestion ─────────────────────────────────────── */

export function ingestRaceIncidents(
  race: RaceFile,
  guidMap: DriverGuidMap,
): Incident[] {
  if (!race.Events?.length) return [];

  // Build per-car cumulative timestamp index for lap-number derivation
  const lapsByCar = new Map<number, RaceLap[]>();
  for (const l of race.Laps) {
    if (l.ClassID === SPECTATOR_CLASS) continue;
    const arr = lapsByCar.get(l.CarId);
    if (arr) arr.push(l);
    else lapsByCar.set(l.CarId, [l]);
  }
  for (const arr of lapsByCar.values()) {
    arr.sort((a, b) => a.Timestamp - b.Timestamp);
  }

  // Compute lap number for an event: laps completed BEFORE event timestamp + 1
  function lapNumberAt(carId: number, ts: number): number {
    const arr = lapsByCar.get(carId);
    if (!arr || arr.length === 0) return 1;
    let completed = 0;
    for (const l of arr) {
      if (l.Timestamp <= ts) completed++;
      else break;
    }
    return Math.max(1, completed + 1);
  }

  // Dedupe: AC sometimes logs the same collision from both cars' perspective
  const seen = new Set<string>();
  const out: Incident[] = [];

  for (const ev of race.Events) {
    if (ev.AfterSessionEnd) continue;
    if (ev.Type !== "COLLISION_WITH_CAR" && ev.Type !== "COLLISION_WITH_ENV") continue;

    const guidA = ev.Driver?.Guid;
    const guidB = ev.OtherDriver?.Guid;

    // Dedupe key — sort the two GUIDs so we count A→B and B→A as one
    const dedupeKey = [guidA, guidB || "wall", Math.floor(ev.Timestamp / 5)]
      .sort()
      .join("|");
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const driverA = guidA ? guidMap[guidA] : undefined;
    if (!driverA) continue;

    const driverIds = [driverA];
    if (guidB && guidMap[guidB]) driverIds.push(guidMap[guidB]);

    const lap = lapNumberAt(ev.CarId, ev.Timestamp);
    const summary =
      ev.Type === "COLLISION_WITH_ENV"
        ? `${ev.Driver?.Name ?? "?"} contra barrera`
        : `Contacto entre ${ev.Driver?.Name ?? "?"} y ${ev.OtherDriver?.Name ?? "?"}`;

    out.push({
      lap,
      kind: "collision",
      driverIds,
      summary,
    });
  }

  return out.sort((a, b) => a.lap - b.lap);
}

/* ── Full session ingestion ──────────────────────────────────── */

/**
 * Convert an AC race export into all four session sub-fields.
 * Use this for fresh ingestion — to overwrite a single field, call the per-piece functions directly.
 */
export function ingestRaceFile(
  race: RaceFile,
  opts: IngestOptions,
): IngestedSessionData {
  return {
    laps: ingestRaceLaps(race, opts.guidMap),
    results: ingestRaceResults(race, opts),
    incidents: ingestRaceIncidents(race, opts.guidMap),
    conditions: pickConditions(race),
  };
}

/**
 * Apply ingested laps to a session (legacy single-purpose helper kept for compatibility).
 * Prefer `ingestRaceFile` for new callers.
 */
export function applyRaceFileToSession(
  session: Session,
  race: RaceFile,
  guidMap: DriverGuidMap,
): Session {
  const laps = ingestRaceLaps(race, guidMap);
  return { ...session, laps };
}
