import type { Championship, TrackRecord } from "@/lib/types";
import { getDriver, getTeam } from "@/lib/store";

function lapToMs(time: string): number {
  const parts = time.split(":");
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60000 + parseFloat(parts[1]) * 1000;
  }
  return parseFloat(time) * 1000;
}

export function deriveTrackRecords(champ: Championship): TrackRecord[] {
  // best[trackId][classId] = TrackRecord
  const best = new Map<string, TrackRecord>();

  for (const round of champ.rounds) {
    const trackId = round.track.id;

    for (const session of round.sessions) {
      if (session.laps.length === 0) continue;

      for (const lap of session.laps) {
        if (lap.cut) continue;

        const result = session.results.find((r) => r.driverId === lap.driverId);
        if (!result) continue;

        const key = `${trackId}::${result.classId}`;
        const existing = best.get(key);
        const ms = lapToMs(lap.time);
        const existingMs = existing ? lapToMs(existing.time) : Infinity;

        if (ms < existingMs) {
          const classDef = champ.classes.find((c) => c.id === result.classId);
          const carName = (classDef?.car ?? result.classId)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          best.set(key, {
            trackId,
            classId: result.classId,
            carName,
            time: lap.time,
            driverName: getDriver(lap.driverId)?.name ?? lap.driverId,
            teamName: getTeam(result.teamId)?.name ?? result.teamId,
            sessionId: session.id,
            date: round.date,
          });
        }
      }
    }
  }

  return [...best.values()];
}
