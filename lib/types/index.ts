import { z } from "zod";

export const ConditionsSchema = z.object({
  airTemp: z.number(),
  trackTemp: z.number(),
  weather: z.string(),
  windKph: z.number().optional(),
});

export const ClassDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  car: z.string(),
});

export const ResultSchema = z.object({
  pos: z.number(),
  gridPos: z.number(),
  driverId: z.string(),
  teamId: z.string(),
  classId: z.string(),
  bestLap: z.string(),
  gap: z.string(),
  points: z.number(),
  status: z.enum(["finished", "dnf", "dsq", "dnq"]),
});

export const LapSchema = z.object({
  driverId: z.string(),
  lapNo: z.number(),
  time: z.string(),
  sectors: z.tuple([z.string(), z.string(), z.string()]),
  compound: z.enum(["S", "M", "H", "I", "W"]),
  cut: z.boolean(),
  weatherTag: z.string().optional(),
});

export const IncidentSchema = z.object({
  lap: z.number(),
  kind: z.enum(["collision", "offtrack", "drivethrough"]),
  driverIds: z.array(z.string()),
  summary: z.string(),
});

export const SessionSchema = z.object({
  id: z.string(),
  type: z.enum(["practice", "qualifying", "race"]),
  subLabel: z.string().optional(),
  conditions: ConditionsSchema,
  results: z.array(ResultSchema),
  laps: z.array(LapSchema),
  incidents: z.array(IncidentSchema),
  status: z.enum(["upcoming", "live", "done"]).optional().default("done"),
  raceDataFile: z.string().optional(),
});

export const TrackRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  short: z.string(),
  country: z.string(),
  layout: z.string(),
  lengthKm: z.number(),
  turns: z.number(),
});

export const RoundSchema = z.object({
  id: z.string(),
  index: z.number(),
  track: TrackRefSchema,
  date: z.string(),
  sessions: z.array(SessionSchema),
  status: z.enum(["upcoming", "live", "done"]),
  youtubeUrl: z.string().optional(),
});

export const PointsTableSchema = z.object({
  r1: z.array(z.number()),
  r2: z.array(z.number()),
  fastestLapR1: z.number(),
  fastestLapR2: z.number(),
});

export const ChampionshipSchema = z.object({
  id: z.string(),
  season: z.string(),
  year: z.number(),
  name: z.string(),
  classes: z.array(ClassDefSchema),
  rounds: z.array(RoundSchema),
  status: z.enum(["upcoming", "live", "complete"]),
  pointsTable: PointsTableSchema.optional(),
});

export const DriverSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.string(),
  country: z.string(),
  teamId: z.string(),
  license: z.enum(["A", "B", "C"]),
  joined: z.string(),
  picture: z.string().optional(),
  description: z.string().optional(),
  guids: z.array(z.string()).optional().default([]),
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.tuple([z.string(), z.string()]).optional(),
});

// ── Derived view types ────────────────────────────────────────────
export const StandingsRowSchema = z.object({
  pos: z.number(),
  driverId: z.string(),
  name: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  classId: z.string(),
  pts: z.number(),
  wins: z.number(),
  podiums: z.number(),
  poles: z.number(),
  fastestLaps: z.number(),
  dnfs: z.number(),
});

export type Conditions     = z.infer<typeof ConditionsSchema>;
export type ClassDef       = z.infer<typeof ClassDefSchema>;
export type Result         = z.infer<typeof ResultSchema>;
export type Lap            = z.infer<typeof LapSchema>;
export type Incident       = z.infer<typeof IncidentSchema>;
export type Session        = z.infer<typeof SessionSchema>;
export type TrackRef       = z.infer<typeof TrackRefSchema>;
export type Round          = z.infer<typeof RoundSchema>;
export type Championship   = z.infer<typeof ChampionshipSchema>;
export type PointsTable    = z.infer<typeof PointsTableSchema>;
export type Driver         = z.infer<typeof DriverSchema>;
export type Team           = z.infer<typeof TeamSchema>;
export type StandingsRow   = z.infer<typeof StandingsRowSchema>;

export interface DriverSeasonStats {
  driverId: string;
  name: string;
  teamName: string;
  classId: string;
  pts: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  dnfs: number;
  avgFinish: number;
  starts: number;
}

export interface TrackRecord {
  trackId: string;
  classId: string;
  carName: string;
  time: string;
  driverName: string;
  teamName: string;
  sessionId: string;
  date: string;
}

export interface TrackDetail extends TrackRef {
  records: TrackRecord[];
  sessions: { id: string; label: string; date: string; podium: string[] }[];
}

export interface GlobalRecords {
  totalRaces: number;
  totalLaps: number;
  totalDrivers: number;
  allTimeLeaders: {
    stat: string;
    driverName: string;
    value: number | string;
  }[];
  fastestByTrack: TrackRecord[];
}

export interface DriverProfileRaceResult {
  sessionId: string;
  roundIndex: number;
  trackName: string;
  trackShort: string;
  label: string;
  pos: number | null;
  pts: number;
  status: string;
}

export interface DriverProfile extends Driver {
  seasons: {
    championshipId: string;
    season: string;
    pos: number;
    pts: number;
    wins: number;
    podiums: number;
    races: DriverProfileRaceResult[];
  }[];
  trackBests: { trackName: string; time: string; classId: string }[];
  formStrip: {
    roundIndex: number;
    trackShort: string;
    r1Pos: number | null;
    r2Pos: number | null;
    hasFl: boolean;
    status: "done" | "upcoming" | "live";
  }[];
  currentStats?: DriverSeasonStats;
}
