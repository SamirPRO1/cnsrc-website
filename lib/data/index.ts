import { cache } from "react";
import {
  listChampionships as _listChamps,
  getChampionship as _getChamp,
  getSession as _getSession,
  getRound as _getRound,
  listDrivers as _listDrivers,
  getDriver as _getDriver,
  getTeam as _getTeam,
  listTeams as _listTeams,
  listTracks as _listTracks,
  getTrack as _getTrack,
} from "@/lib/store";
import { deriveStandings } from "@/lib/derive/standings";
import { deriveTrackRecords, lapToMs } from "@/lib/derive/trackRecords";
import { computeRacePositions } from "@/lib/derive/lapAnalysis";
import type {
  Championship,
  StandingsRow,
  Session,
  Round,
  Driver,
  Team,
  TrackRef,
  TrackRecord,
  GlobalRecords,
  StatEntry,
  DriverProfile,
  TrackDetail,
} from "@/lib/types";

export const listChampionships = cache((): Championship[] => _listChamps());

export const getChampionship = cache((id: string): Championship | null => _getChamp(id));

export const getStandings = cache(
  (championshipId: string, classId: string): StandingsRow[] => {
    const champ = _getChamp(championshipId);
    if (!champ) return [];
    return deriveStandings(champ, classId);
  }
);

export const getSession = cache((id: string): Session | null => _getSession(id));

export const getRound = cache((id: string): Round | null => _getRound(id));

export const listDrivers = cache((): Driver[] => _listDrivers());

export const getDriver = cache((id: string): Driver | null => _getDriver(id));

export const getTeam = cache((id: string): Team | null => _getTeam(id));

export const listTeams = cache((): Team[] => _listTeams());

export const listTracks = cache((): TrackRef[] => _listTracks());

export const getTrack = cache((id: string): TrackRef | null => _getTrack(id));

export const getDriverProfile = cache((id: string): DriverProfile | null => {
  const driver = _getDriver(id);
  if (!driver) return null;

  const champs = _listChamps();
  const seasons: DriverProfile["seasons"] = [];
  const trackBests: DriverProfile["trackBests"] = [];
  const formStrip: DriverProfile["formStrip"] = [];

  for (const champ of champs) {
    const rows = deriveStandings(champ, "indycar");
    const amRows = deriveStandings(champ, "am");
    const allRows = [...rows, ...amRows];
    const standing = allRows.find((r) => r.driverId === id);

    if (standing) {
      const races: DriverProfile["seasons"][number]["races"] = [];
      for (const round of champ.rounds) {
        const raceSessions = round.sessions.filter((s) => s.type === "race" && s.results.length > 0);
        for (let i = 0; i < raceSessions.length; i++) {
          const session = raceSessions[i];
          const result = session.results.find((r) => r.driverId === id);
          if (result) {
            races.push({
              sessionId: session.id,
              roundIndex: round.index,
              trackName: round.track.name,
              trackShort: round.track.short,
              label: session.subLabel ?? (i === 0 ? "R1" : "R2"),
              pos: result.pos,
              pts: result.points,
              status: result.status,
            });
          }
        }
      }
      seasons.push({
        championshipId: champ.id,
        season: champ.season,
        classId: standing.classId,
        pos: standing.pos,
        pts: standing.pts,
        wins: standing.wins,
        podiums: standing.podiums,
        races,
      });
    }

    // form strip from last champ
    if (champ.id === champs[champs.length - 1]?.id) {
      for (const round of champ.rounds) {
        const raceSessions = round.sessions.filter((s) => s.type === "race");
        const r1 = raceSessions[0]?.results.find((r) => r.driverId === id);
        const r2 = raceSessions[1]?.results.find((r) => r.driverId === id);
        const hasFl = raceSessions.some((s) =>
          s.laps.some(
            (l) =>
              l.driverId === id &&
              !l.cut &&
              l.time === Math.min(...s.laps.filter((x) => !x.cut).map((x) => x.time as unknown as number)).toString()
          )
        );

        formStrip.push({
          roundIndex: round.index,
          trackShort: round.track.short,
          r1Pos: r1?.pos ?? null,
          r2Pos: r2?.pos ?? null,
          hasFl,
          status: round.status,
        });
      }
    }
  }

  const records = deriveTrackRecords(champs[0]!);
  for (const rec of records) {
    if (rec.driverName === driver.name) {
      trackBests.push({ trackName: rec.trackId, time: rec.time, classId: rec.classId });
    }
  }

  return {
    ...driver,
    seasons,
    trackBests,
    formStrip,
  };
});

export const getDriverRaceCount = cache((driverId: string): number => {
  const champs = _listChamps();
  let count = 0;
  for (const champ of champs) {
    for (const round of champ.rounds) {
      for (const session of round.sessions) {
        if (session.type === "race" && session.results.some((r) => r.driverId === driverId)) {
          count++;
        }
      }
    }
  }
  return count;
});

export const getTrackDetail = cache((trackId: string): TrackDetail | null => {
  const champs = _listChamps();
  let trackRef = null;
  const sessions: TrackDetail["sessions"] = [];
  const bestByCar = new Map<string, TrackRecord>();

  for (const champ of champs) {
    for (const rec of deriveTrackRecords(champ)) {
      if (rec.trackId !== trackId) continue;
      const existing = bestByCar.get(rec.carName);
      if (!existing || lapToMs(rec.time) < lapToMs(existing.time)) bestByCar.set(rec.carName, rec);
    }

    for (const round of champ.rounds) {
      if (round.track.id !== trackId) continue;
      trackRef = round.track;
      for (const session of round.sessions) {
        if (session.type !== "race" || session.results.length === 0) continue;
        const classIds = new Set(session.results.map((r) => r.classId));
        let podium: { name: string; classId: string }[];
        if (classIds.size > 1) {
          // Multi-class: one winner (P1) per class
          const seen = new Set<string>();
          podium = [];
          for (const r of session.results) {
            if (!seen.has(r.classId) && r.pos === 1) {
              seen.add(r.classId);
              podium.push({ name: _getDriver(r.driverId)?.name ?? r.driverId, classId: r.classId });
            }
          }
        } else {
          // Single-class: top 3
          podium = session.results.slice(0, 3).map((r) => ({
            name: _getDriver(r.driverId)?.name ?? r.driverId,
            classId: r.classId,
          }));
        }
        sessions.push({
          id: session.id,
          label: `${champ.season} · ${session.subLabel ?? session.type}`,
          date: round.date,
          podium,
        });
      }
    }
  }

  if (!trackRef) return null;
  return { ...trackRef, records: [...bestByCar.values()], sessions };
});

export const getGlobalRecords = cache((): GlobalRecords => {
  const champs = _listChamps();

  let totalRaces = 0;
  let totalLaps  = 0;
  const driverSet = new Set<string>();

  // PRO accumulators (classId !== "am")
  const proWins        = new Map<string, number>();
  const proPodiums     = new Map<string, number>();
  const proPoles       = new Map<string, number>();
  const proFl          = new Map<string, number>();
  const proStarts      = new Map<string, number>();
  const proDnfs        = new Map<string, number>();
  const proTitles      = new Map<string, number>();
  const proWinsFromPole = new Map<string, number>();
  const proSeasonBest  = new Map<string, number>();
  const proLedLaps     = new Map<string, number>();

  // Ordered PRO race winners — for consecutive streak computation
  const proWinnerLog: string[] = [];

  // AM accumulators
  const amWins     = new Map<string, number>();
  const amPodiums  = new Map<string, number>();
  const amPoles    = new Map<string, number>();
  const amLedLaps  = new Map<string, number>();

  const inc = (m: Map<string, number>, id: string) => m.set(id, (m.get(id) ?? 0) + 1);
  const add = (m: Map<string, number>, id: string, n: number) => m.set(id, (m.get(id) ?? 0) + n);

  for (const champ of champs) {
    // Championship title
    const champion = deriveStandings(champ, "indycar")[0];
    if (champion) inc(proTitles, champion.driverId);

    // Per-season win count for best-season stat
    const seasonWins = new Map<string, number>();

    for (const round of champ.rounds) {
      // Pole sitter for this round (used for wins-from-pole)
      let proPoleDriver: string | null = null;

      for (const session of round.sessions) {
        totalLaps += session.laps.length;
        session.results.forEach((r) => driverSet.add(r.driverId));

        if (session.type === "qualifying") {
          const proPole = session.results.find((r) => r.classId !== "am" && r.pos === 1);
          if (proPole) { proPoleDriver = proPole.driverId; inc(proPoles, proPole.driverId); }
          const amPole = session.results.find((r) => r.classId === "am" && r.pos === 1);
          if (amPole) inc(amPoles, amPole.driverId);
          continue;
        }

        if (session.type !== "race" || session.results.length === 0) continue;

        const proResults = session.results.filter((r) => r.classId !== "am");
        const amResults  = session.results.filter((r) => r.classId === "am");
        const isFirstRace = (session.subLabel ?? "") === "R1" ||
          round.sessions.filter((s) => s.type === "race").indexOf(session) === 0;

        if (proResults.length > 0) {
          totalRaces++;
          for (const r of proResults) {
            inc(proStarts, r.driverId);
            if (r.pos === 1) { inc(proWins, r.driverId); inc(seasonWins, r.driverId); }
            if (r.pos <= 3) inc(proPodiums, r.driverId);
            if (r.status === "dnf") inc(proDnfs, r.driverId);
          }

          const winner = proResults.find((r) => r.pos === 1);
          if (winner) {
            proWinnerLog.push(winner.driverId);
            // Win from pole only on first race of the round (grid from qualifying)
            if (isFirstRace && proPoleDriver === winner.driverId) {
              inc(proWinsFromPole, winner.driverId);
            }
          }

          // Fastest lap among PRO drivers
          let bestMs = Infinity;
          let flDriver = "";
          for (const lap of session.laps) {
            if (lap.cut) continue;
            if (!proResults.some((r) => r.driverId === lap.driverId)) continue;
            const ms = lapToMs(lap.time);
            if (ms < bestMs) { bestMs = ms; flDriver = lap.driverId; }
          }
          if (flDriver) inc(proFl, flDriver);
        }

        for (const r of amResults) {
          if (r.pos === 1) inc(amWins, r.driverId);
          if (r.pos <= 3) inc(amPodiums, r.driverId);
        }

        // Led laps — computed per class so mixed-class sessions are handled correctly
        if (session.laps.length > 0) {
          if (proResults.length > 0) {
            const proLaps = session.laps.filter((l) => proResults.some((r) => r.driverId === l.driverId));
            for (const ds of computeRacePositions(proResults, proLaps)) {
              const led = ds.points.filter((p) => p.pos === 1).length;
              if (led > 0) add(proLedLaps, ds.driverId, led);
            }
          }
          if (amResults.length > 0) {
            const amLaps = session.laps.filter((l) => amResults.some((r) => r.driverId === l.driverId));
            for (const ds of computeRacePositions(amResults, amLaps)) {
              const led = ds.points.filter((p) => p.pos === 1).length;
              if (led > 0) add(amLedLaps, ds.driverId, led);
            }
          }
        }
      }
    }

    for (const [id, wins] of seasonWins) {
      if (wins > (proSeasonBest.get(id) ?? 0)) proSeasonBest.set(id, wins);
    }
  }

  // Max consecutive win streak from the ordered log
  const maxStreak  = new Map<string, number>();
  const curStreak  = new Map<string, number>();
  for (const winnerId of proWinnerLog) {
    for (const id of curStreak.keys()) if (id !== winnerId) curStreak.set(id, 0);
    const s = (curStreak.get(winnerId) ?? 0) + 1;
    curStreak.set(winnerId, s);
    if (s > (maxStreak.get(winnerId) ?? 0)) maxStreak.set(winnerId, s);
  }

  const topN = (m: Map<string, number>, n = 5): StatEntry[] =>
    [...m.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id, value]) => ({ driverName: _getDriver(id)?.name ?? id, value }));

  return {
    totalRaces,
    totalLaps,
    totalDrivers: driverSet.size,
    totalChampionships: champs.length,
    proStats: [
      { label: "VICTORIAS",            eyebrow: "TODO TIEMPO",       top: topN(proWins) },
      { label: "PODIOS",               eyebrow: "TODO TIEMPO",       top: topN(proPodiums) },
      { label: "POLES",                eyebrow: "CLASIFICACIÓN",     top: topN(proPoles) },
      { label: "VUELTAS RÁPIDAS",      eyebrow: "EN CARRERA",        top: topN(proFl) },
      { label: "VUELTAS LIDERADAS",    eyebrow: "EN CARRERA",        top: topN(proLedLaps) },
      { label: "RACHA",                eyebrow: "VICTORIAS CONSEC.", top: topN(maxStreak) },
      { label: "MEJOR TEMPORADA",      eyebrow: "VICTORIAS EN S.",   top: topN(proSeasonBest) },
      { label: "VICTORIA DESDE POLE",  eyebrow: "POLE → WIN",        top: topN(proWinsFromPole) },
      { label: "TÍTULOS",              eyebrow: "CAMPEONATOS",       top: topN(proTitles) },
      { label: "STARTS",               eyebrow: "PARTICIPACIÓN",     top: topN(proStarts) },
      { label: "DNF",                  eyebrow: "ABANDONOS",         top: topN(proDnfs) },
    ],
    amStats: [
      { label: "VICTORIAS",         eyebrow: "CLASE AM · S02", top: topN(amWins) },
      { label: "PODIOS",            eyebrow: "CLASE AM · S02", top: topN(amPodiums) },
      { label: "POLES",             eyebrow: "CLASE AM · S02", top: topN(amPoles) },
      { label: "VUELTAS LIDERADAS", eyebrow: "CLASE AM · S02", top: topN(amLedLaps) },
    ],
  };
});
