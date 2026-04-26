import type { Championship, StandingsRow } from "@/lib/types";
import { getTeam, getDriver } from "@/lib/store";

export function deriveStandings(champ: Championship, classId: string): StandingsRow[] {
  const acc = new Map<string, Omit<StandingsRow, "pos">>();

  for (const round of champ.rounds) {
    for (const session of round.sessions) {
      // Tally poles from qualifying
      if (session.type === "qualifying" && session.results[0]) {
        const poleResult = session.results[0];
        if (poleResult.classId === classId) {
          const entry = acc.get(poleResult.driverId);
          if (entry) entry.poles++;
        }
      }

      if (session.type !== "race") continue;

      for (const result of session.results) {
        if (result.classId !== classId) continue;

        const entry = acc.get(result.driverId) ?? {
          driverId: result.driverId,
          name: getDriver(result.driverId)?.name ?? result.driverId,
          teamId: result.teamId,
          teamName: getTeam(result.teamId)?.name ?? result.teamId,
          classId,
          pts: 0,
          wins: 0,
          podiums: 0,
          poles: 0,
          fastestLaps: 0,
          dnfs: 0,
        };

        entry.pts += result.points;
        if (result.pos === 1) entry.wins++;
        if (result.pos <= 3) entry.podiums++;
        if (result.status === "dnf") entry.dnfs++;

        acc.set(result.driverId, entry);
      }
    }
  }

  const rows = [...acc.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    if (b.poles !== a.poles) return b.poles - a.poles;
    return b.fastestLaps - a.fastestLaps;
  });

  return rows.map((r, i) => ({ ...r, pos: i + 1 }));
}
