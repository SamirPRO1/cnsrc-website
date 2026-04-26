import type { Championship, Driver, Team, TrackRef, Session, Round } from "@/lib/types";

// Static JSON imports — re-deploy when new files are added to data/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW_CHAMPIONSHIPS: unknown[] = [
  require("@/data/cnsrc-s01.json"),
  require("@/data/cnsrc-s02.json"),
  require("@/data/cnsrc-s03.json"),
];
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW_REGISTRY: { drivers: Driver[]; teams: Team[] } = require("@/data/drivers.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW_TRACKS: { tracks: TrackRef[] } = require("@/data/tracks.json");

interface Store {
  championships: Map<string, Championship>;
  drivers: Map<string, Driver>;
  teams: Map<string, Team>;
  tracks: Map<string, TrackRef>;
  rounds: Map<string, Round>;
  sessions: Map<string, Session>;
}

let _store: Store | null = null;

function buildStore(): Store {
  const store: Store = {
    championships: new Map(),
    drivers: new Map(),
    teams: new Map(),
    tracks: new Map(),
    rounds: new Map(),
    sessions: new Map(),
  };

  for (const d of RAW_REGISTRY.drivers) store.drivers.set(d.id, d);
  for (const t of RAW_REGISTRY.teams)   store.teams.set(t.id, t);
  for (const tr of RAW_TRACKS.tracks)   store.tracks.set(tr.id, tr);

  for (const raw of RAW_CHAMPIONSHIPS) {
    try {
      const champ = raw as Championship;
      store.championships.set(champ.id, champ);

      for (const round of champ.rounds) {
        store.rounds.set(round.id, round);
        for (const session of round.sessions) {
          store.sessions.set(session.id, session);
        }
      }
    } catch (e) {
      console.warn("[store] failed to parse championship:", e);
    }
  }

  return store;
}

function getStore(): Store {
  if (!_store) _store = buildStore();
  return _store;
}

export function listChampionships(): Championship[] {
  return [...getStore().championships.values()];
}

export function getChampionship(id: string): Championship | null {
  return getStore().championships.get(id) ?? null;
}

export function getRound(id: string): Round | null {
  return getStore().rounds.get(id) ?? null;
}

export function getSession(id: string): Session | null {
  return getStore().sessions.get(id) ?? null;
}

export function listDrivers(): Driver[] {
  return [...getStore().drivers.values()];
}

export function getDriver(id: string): Driver | null {
  return getStore().drivers.get(id) ?? null;
}

export function getTeam(id: string): Team | null {
  return getStore().teams.get(id) ?? null;
}

export function listTeams(): Team[] {
  return [...getStore().teams.values()];
}

export function listTracks(): TrackRef[] {
  return [...getStore().tracks.values()];
}

export function getTrack(id: string): TrackRef | null {
  return getStore().tracks.get(id) ?? null;
}
