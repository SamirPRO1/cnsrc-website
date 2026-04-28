import fs from "node:fs";
import path from "node:path";
import type { Driver, Team, TrackRef, Championship } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

/* ── Drivers & Teams (drivers.json) ──────────────────────────── */

interface DriversFile {
  drivers: Driver[];
  teams: Team[];
}

export function readDriversFile(): DriversFile {
  const raw = fs.readFileSync(path.join(DATA_DIR, "drivers.json"), "utf-8");
  return JSON.parse(raw);
}

export function writeDriversFile(data: DriversFile): void {
  fs.writeFileSync(
    path.join(DATA_DIR, "drivers.json"),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

/* ── Tracks (tracks.json) ────────────────────────────────────── */

interface TracksFile {
  tracks: TrackRef[];
}

export function readTracksFile(): TracksFile {
  const raw = fs.readFileSync(path.join(DATA_DIR, "tracks.json"), "utf-8");
  return JSON.parse(raw);
}

export function writeTracksFile(data: TracksFile): void {
  fs.writeFileSync(
    path.join(DATA_DIR, "tracks.json"),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

/* ── Championships (cnsrc-*.json) ────────────────────────────── */

export function listChampionshipIds(): string[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.startsWith("cnsrc-") && f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

export function readChampionshipFile(id: string): Championship {
  const raw = fs.readFileSync(path.join(DATA_DIR, `${id}.json`), "utf-8");
  return JSON.parse(raw);
}

export function writeChampionshipFile(
  id: string,
  data: Championship,
): void {
  fs.writeFileSync(
    path.join(DATA_DIR, `${id}.json`),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export function deleteChampionshipFile(id: string): void {
  const p = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/* ── Driver GUIDs (driver-guids.json) ───────────────────────── */

export function readDriverGuidsFile(): Record<string, string> {
  const raw = fs.readFileSync(path.join(DATA_DIR, "driver-guids.json"), "utf-8");
  return JSON.parse(raw);
}

/* ── File stats (for dashboard) ──────────────────────────────── */

export interface DataFileInfo {
  name: string;
  sizeKb: number;
  modifiedAt: string;
}

export function getDataFileStats(): DataFileInfo[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const stat = fs.statSync(path.join(DATA_DIR, f));
      return {
        name: f,
        sizeKb: Math.round(stat.size / 1024),
        modifiedAt: stat.mtime.toISOString(),
      };
    });
}
