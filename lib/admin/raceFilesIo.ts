import fs from "node:fs";
import path from "node:path";

const RACES_DIR = path.join(process.cwd(), "data", "races");
const GUID_MAP_PATH = path.join(process.cwd(), "data", "driver-guids.json");
const CLASS_UUIDS_PATH = path.join(process.cwd(), "data", "class-uuids.json");

export interface RaceFileMeta {
  filename: string;
  sizeKb: number;
  modifiedAt: string;
  trackName?: string;
  eventName?: string;
  date?: string;
  laps?: number;
  cars?: number;
  resultCount?: number;
}

function ensureDir() {
  if (!fs.existsSync(RACES_DIR)) fs.mkdirSync(RACES_DIR, { recursive: true });
}

/** List all .json race files with parsed metadata. */
export function listRaceFiles(): RaceFileMeta[] {
  ensureDir();
  return fs
    .readdirSync(RACES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "racedata.md")
    .map((filename) => {
      const full = path.join(RACES_DIR, filename);
      const stat = fs.statSync(full);
      const meta: RaceFileMeta = {
        filename,
        sizeKb: Math.round(stat.size / 1024),
        modifiedAt: stat.mtime.toISOString(),
      };
      try {
        const raw = JSON.parse(fs.readFileSync(full, "utf-8"));
        meta.trackName = raw.TrackName;
        meta.eventName = raw.EventName;
        meta.date = raw.Date;
        meta.laps = raw.SessionConfig?.laps;
        meta.cars = raw.Cars?.length;
        meta.resultCount = raw.Result?.length;
      } catch {
        /* skip parse errors */
      }
      return meta;
    });
}

export function readRaceFile(filename: string): unknown {
  const full = path.join(RACES_DIR, filename);
  if (!fs.existsSync(full)) throw new Error("not found");
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

export function writeRaceFile(filename: string, content: string): void {
  ensureDir();
  // Validate that it's parseable JSON before writing
  JSON.parse(content);
  fs.writeFileSync(path.join(RACES_DIR, filename), content, "utf-8");
}

export function deleteRaceFile(filename: string): void {
  const full = path.join(RACES_DIR, filename);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

export function readGuidMap(): Record<string, string> {
  const map: Record<string, string> = {};

  // Seed from driver-guids.json (legacy fallback — driver records take priority below)
  if (fs.existsSync(GUID_MAP_PATH)) {
    Object.assign(map, JSON.parse(fs.readFileSync(GUID_MAP_PATH, "utf-8")));
  }

  // Driver records override: each driver owns its own GUIDs
  try {
    const { drivers } = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "drivers.json"), "utf-8"),
    ) as { drivers: Array<{ id: string; guids?: string[] }> };
    for (const d of drivers) {
      for (const guid of d.guids ?? []) {
        map[guid] = d.id;
      }
    }
  } catch {
    /* drivers.json unreadable — rely on legacy file */
  }

  return map;
}

export function readClassUuidMap(): Record<string, string> {
  if (!fs.existsSync(CLASS_UUIDS_PATH)) return {};
  return JSON.parse(fs.readFileSync(CLASS_UUIDS_PATH, "utf-8"));
}

/** Sanitize a user-supplied filename. Returns a safe filename or null. */
export function sanitizeFilename(name: string): string | null {
  const cleaned = path.basename(name).trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return null;
  if (!cleaned.endsWith(".json")) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(cleaned)) return null;
  return cleaned;
}
