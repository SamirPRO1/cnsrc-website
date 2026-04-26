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
import { deriveTrackRecords } from "@/lib/derive/trackRecords";
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
  const records: TrackRecord[] = [];

  for (const champ of champs) {
    const recs = deriveTrackRecords(champ);
    records.push(...recs.filter((r) => r.trackId === trackId));

    for (const round of champ.rounds) {
      if (round.track.id !== trackId) continue;
      trackRef = round.track;
      for (const session of round.sessions) {
        if (session.type !== "race" || session.results.length === 0) continue;
        const podium = session.results.slice(0, 3).map(
          (r) => _getDriver(r.driverId)?.name ?? r.driverId
        );
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
  return { ...trackRef, records, sessions };
});

export const getGlobalRecords = cache((): GlobalRecords => {
  const champs = _listChamps();
  let totalRaces = 0;
  let totalLaps = 0;
  const driverSet = new Set<string>();
  const allRecords: TrackRecord[] = [];

  const winCounts = new Map<string, number>();

  for (const champ of champs) {
    for (const round of champ.rounds) {
      for (const session of round.sessions) {
        if (session.type === "race" && session.results.length > 0) {
          totalRaces++;
          const winner = session.results[0];
          winCounts.set(winner.driverId, (winCounts.get(winner.driverId) ?? 0) + 1);
        }
        totalLaps += session.laps.length;
        session.results.forEach((r) => driverSet.add(r.driverId));
      }
    }
    allRecords.push(...deriveTrackRecords(champ));
  }

  const topWinner = [...winCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topWinnerName = topWinner ? (_getDriver(topWinner[0])?.name ?? topWinner[0]) : "—";

  return {
    totalRaces,
    totalLaps,
    totalDrivers: driverSet.size,
    allTimeLeaders: [
      { stat: "WINS", driverName: topWinnerName, value: topWinner?.[1] ?? 0 },
    ],
    fastestByTrack: allRecords,
  };
});
