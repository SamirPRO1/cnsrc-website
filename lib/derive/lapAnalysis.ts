import type { Lap, Result } from "@/lib/types";

/* ── Time string helpers ─────────────────────────────────────── */

/** "1:23.456" or "23.456" → milliseconds. Returns NaN on bad input. */
export function parseLapTime(s: string): number {
  if (!s) return NaN;
  const trimmed = s.trim();
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx === -1) {
    const sec = parseFloat(trimmed);
    return Number.isFinite(sec) ? Math.round(sec * 1000) : NaN;
  }
  const mins = parseInt(trimmed.slice(0, colonIdx), 10);
  const sec = parseFloat(trimmed.slice(colonIdx + 1));
  if (!Number.isFinite(mins) || !Number.isFinite(sec)) return NaN;
  return Math.round(mins * 60_000 + sec * 1000);
}

/** ms → "M:SS.mmm" (or "SS.mmm" if under a minute). */
export function formatLapTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const mins = Math.floor(ms / 60_000);
  const sec = (ms - mins * 60_000) / 1000;
  if (mins === 0) return sec.toFixed(3);
  return `${mins}:${sec.toFixed(3).padStart(6, "0")}`;
}

/** ms → "+1.234" / "+1:02.345" — for delta display. */
export function formatGap(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  if (ms === 0) return "—";
  const sign = ms > 0 ? "+" : "−";
  const abs = Math.abs(ms);
  return sign + formatLapTime(abs);
}

/* ── Per-driver lap analysis ─────────────────────────────────── */

export interface DriverLapStats {
  driverId: string;
  totalLaps: number;
  validLaps: number;
  fastestLapMs: number | null;
  fastestLapNo: number | null;
  slowestValidLapMs: number | null;
  averageValidLapMs: number | null;
  /** sum of best valid sector times across all valid laps */
  theoreticalBestMs: number | null;
  bestSectorsMs: [number | null, number | null, number | null];
  /** % stability vs the fastest lap; 100% = every lap matched the fastest */
  consistencyPct: number | null;
  /** slowestValid - fastestValid in ms */
  spreadMs: number | null;
}

/** Per-driver lap rows, parsed and ordered, with valid/invalid flag. */
export interface ParsedLap {
  lapNo: number;
  timeMs: number;
  sectorsMs: [number, number, number];
  compound: string;
  cut: boolean;
  valid: boolean;
}

export function parseDriverLaps(laps: Lap[]): ParsedLap[] {
  return laps
    .map((l) => {
      const timeMs = parseLapTime(l.time);
      const sectorsMs = l.sectors.map(parseLapTime) as [number, number, number];
      const sectorsValid = sectorsMs.every((s) => Number.isFinite(s));
      const valid = !l.cut && Number.isFinite(timeMs) && sectorsValid;
      return {
        lapNo: l.lapNo,
        timeMs,
        sectorsMs,
        compound: l.compound,
        cut: l.cut,
        valid,
      };
    })
    .sort((a, b) => a.lapNo - b.lapNo);
}

export function analyzeDriverLaps(driverId: string, laps: Lap[]): DriverLapStats {
  const parsed = parseDriverLaps(laps);
  const valid = parsed.filter((l) => l.valid && Number.isFinite(l.timeMs) && l.lapNo !== 1);

  if (valid.length === 0) {
    return {
      driverId,
      totalLaps: parsed.length,
      validLaps: 0,
      fastestLapMs: null,
      fastestLapNo: null,
      slowestValidLapMs: null,
      averageValidLapMs: null,
      theoreticalBestMs: null,
      bestSectorsMs: [null, null, null],
      consistencyPct: null,
      spreadMs: null,
    };
  }

  let fastestLapMs = Infinity;
  let fastestLapNo = 0;
  let slowestValidLapMs = -Infinity;
  let sumMs = 0;
  const bestSectors: [number, number, number] = [Infinity, Infinity, Infinity];

  for (const l of valid) {
    if (l.timeMs < fastestLapMs) {
      fastestLapMs = l.timeMs;
      fastestLapNo = l.lapNo;
    }
    if (l.timeMs > slowestValidLapMs) slowestValidLapMs = l.timeMs;
    sumMs += l.timeMs;
    for (let i = 0; i < 3; i++) {
      if (l.sectorsMs[i] < bestSectors[i]) bestSectors[i] = l.sectorsMs[i];
    }
  }

  const averageValidLapMs = sumMs / valid.length;
  const theoreticalBestMs = bestSectors[0] + bestSectors[1] + bestSectors[2];
  const consistencyPct = (fastestLapMs / averageValidLapMs) * 100;
  const spreadMs = slowestValidLapMs - fastestLapMs;

  return {
    driverId,
    totalLaps: parsed.length,
    validLaps: valid.length,
    fastestLapMs,
    fastestLapNo,
    slowestValidLapMs,
    averageValidLapMs,
    theoreticalBestMs,
    bestSectorsMs: bestSectors,
    consistencyPct,
    spreadMs,
  };
}

/* ── Per-lap race positions ──────────────────────────────────── */

export interface PositionPoint {
  lap: number;
  /** position on this lap, or null if driver hadn't completed this lap */
  pos: number | null;
}

export interface DriverPositionSeries {
  driverId: string;
  startGrid: number;
  points: PositionPoint[];
}

/**
 * Compute per-lap finishing positions for every driver in the results.
 *
 * When laps include the absolute `timestamp` of the line crossing, ranks
 * drivers at lap N by that timestamp (ascending) — this correctly handles
 * drivers who joined late or had a delayed start.
 *
 * Falls back to cumulative LapTime ordering for legacy data without
 * timestamps. (Cumulative ordering is wrong when drivers don't all start
 * the race at the same instant.)
 */
export function computeRacePositions(
  results: Result[],
  laps: Lap[],
): DriverPositionSeries[] {
  if (laps.length === 0) return [];

  // Index laps by driver, preserving timestamp when present
  const lapsByDriver = new Map<
    string,
    Array<ParsedLap & { timestamp?: number }>
  >();
  for (const l of laps) {
    const entry = {
      lapNo: l.lapNo,
      timeMs: parseLapTime(l.time),
      sectorsMs: l.sectors.map(parseLapTime) as [number, number, number],
      compound: l.compound,
      cut: l.cut,
      valid: !l.cut,
      timestamp: l.timestamp,
    };
    const arr = lapsByDriver.get(l.driverId);
    if (arr) arr.push(entry);
    else lapsByDriver.set(l.driverId, [entry]);
  }

  for (const arr of lapsByDriver.values()) arr.sort((a, b) => a.lapNo - b.lapNo);

  // Per-driver lookup: lap N → ordering key (timestamp if available, else cumulative LapTime)
  const keyByDriverByLap = new Map<string, Map<number, number>>();
  for (const [driverId, arr] of lapsByDriver) {
    const keys = new Map<number, number>();
    let total = 0;
    for (const l of arr) {
      if (typeof l.timestamp === "number") {
        keys.set(l.lapNo, l.timestamp);
      } else if (Number.isFinite(l.timeMs)) {
        total += l.timeMs;
        keys.set(l.lapNo, total);
      }
    }
    keyByDriverByLap.set(driverId, keys);
  }

  const maxLap = Math.max(...laps.map((l) => l.lapNo));
  const driverIds = results.map((r) => r.driverId);

  const positionsByDriver = new Map<string, PositionPoint[]>();
  for (const id of driverIds) positionsByDriver.set(id, []);

  for (let lapNo = 1; lapNo <= maxLap; lapNo++) {
    const completed: { driverId: string; key: number }[] = [];
    const notYet: { driverId: string; lapsDone: number }[] = [];
    for (const id of driverIds) {
      const keys = keyByDriverByLap.get(id);
      const k = keys?.get(lapNo);
      if (k !== undefined) {
        completed.push({ driverId: id, key: k });
      } else {
        const lapsDone = (lapsByDriver.get(id) ?? []).filter(
          (l) => l.lapNo < lapNo,
        ).length;
        notYet.push({ driverId: id, lapsDone });
      }
    }
    completed.sort((a, b) => a.key - b.key);
    notYet.sort((a, b) => b.lapsDone - a.lapsDone);

    let pos = 1;
    for (const c of completed) {
      positionsByDriver.get(c.driverId)!.push({ lap: lapNo, pos });
      pos++;
    }
    for (const n of notYet) {
      positionsByDriver.get(n.driverId)!.push({ lap: lapNo, pos: null });
      pos++;
    }
  }

  return results.map((r) => ({
    driverId: r.driverId,
    startGrid: r.gridPos,
    points: positionsByDriver.get(r.driverId) ?? [],
  }));
}
