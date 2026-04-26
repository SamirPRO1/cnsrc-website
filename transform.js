// transform.js — Run: node transform.js
// Converts AC Server Manager championship JSONs → site SKELETON.
//
// What this writes:
//   - drivers.json (driver + team registry)
//   - tracks.json  (track metadata table)
//   - cnsrc-sNN.json: championship + class + round + EMPTY session shells
//
// What this does NOT write:
//   - session.results / session.laps / session.incidents / session.conditions
//
// Per-session race data (results, laps, incidents, conditions) is filled by the
// race-data ingestion pipeline (see lib/admin/ingestRaceData.ts and
// data/races/racedata.md). Drop the AC race export JSONs into data/races/ and
// ingest them via the admin panel at /admin/championships/[id]/rounds/[roundId].
//
// This script is idempotent for new championships. For existing championships
// that already have ingested race data in data/cnsrc-sNN.json, prefer NOT
// re-running this script — it would clobber the populated sessions.
//
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs   = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

function readJson(p) {
  let raw = fs.readFileSync(p, "utf8");
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
  return JSON.parse(raw);
}

const SRC  = "C:\\Users\\Zahia\\Downloads\\configchamp\\shared_store.json";
const DEST = "C:\\Users\\Zahia\\Downloads\\cnsrc\\data";
const RW   = path.join(SRC, "race_weekends");
const CH   = path.join(SRC, "championships", "championships");

// ── Track metadata table ──────────────────────────────────────────────────
const TRACKS = {
  fn_bahrain:           { id:"bahrain",      name:"Circuito Internacional de Bahrain",  short:"BHR", country:"Bahréin",         lengthKm:5.412, turns:15, layout:"Grand Prix" },
  singapore_2020:       { id:"singapore",    name:"Circuito Marina Bay",                short:"SGP", country:"Singapur",        lengthKm:5.063, turns:23, layout:"Callejero" },
  vhe_interlagos:       { id:"interlagos",   name:"Autódromo José Carlos Pace",         short:"INT", country:"Brasil",          lengthKm:4.309, turns:15, layout:"Grand Prix" },
  ks_laguna_seca:       { id:"laguna",       name:"WeatherTech Raceway Laguna Seca",    short:"LAG", country:"EE.UU.",          lengthKm:3.602, turns:11, layout:"Carretera" },
  aa_ims:               { id:"indy",         name:"Indianapolis Motor Speedway",        short:"IND", country:"EE.UU.",          lengthKm:4.023, turns:4,  layout:"Óvalo" },
  cota_2022:            { id:"cota",         name:"Circuit of the Americas",            short:"COT", country:"EE.UU.",          lengthKm:5.513, turns:20, layout:"Grand Prix" },
  rt_sonoma:            { id:"sonoma",       name:"Sonoma Raceway",                     short:"SON", country:"EE.UU.",          lengthKm:3.999, turns:10, layout:"Carretera" },
  jeddah_2021_chq:      { id:"jeddah",       name:"Circuito Callejero de Jeddah",       short:"JED", country:"Arabia Saudita",  lengthKm:6.174, turns:27, layout:"Callejero" },
  rt_sebring:           { id:"sebring",      name:"Sebring International Raceway",      short:"SEB", country:"EE.UU.",          lengthKm:6.019, turns:17, layout:"Carretera" },
  jr_road_atlanta_2022: { id:"roadatlanta",  name:"Road Atlanta",                       short:"ATL", country:"EE.UU.",          lengthKm:4.088, turns:12, layout:"Carretera" },
  fn_imola:             { id:"imola",        name:"Autodromo Enzo e Dino Ferrari",      short:"IML", country:"Italia",          lengthKm:4.909, turns:19, layout:"Grand Prix" },
  lilski_road_america:  { id:"roadamerica",  name:"Road America",                       short:"ROA", country:"EE.UU.",          lengthKm:6.515, turns:14, layout:"Carretera" },
  algarve_portimao_2023:{ id:"portimao",     name:"Autódromo Internacional do Algarve", short:"POR", country:"Portugal",        lengthKm:4.653, turns:15, layout:"Grand Prix" },
  miami_f1:             { id:"miami",        name:"Miami International Autodrome",      short:"MIA", country:"EE.UU.",          lengthKm:5.412, turns:19, layout:"Callejero" },
  montreal:             { id:"montreal",     name:"Circuit Gilles-Villeneuve",          short:"MCL", country:"Canadá",          lengthKm:4.361, turns:14, layout:"Semicallejero" },
  fn_barcelona:         { id:"barcelona",    name:"Circuit de Barcelona-Catalunya",     short:"BCN", country:"España",          lengthKm:4.675, turns:16, layout:"Grand Prix" },
  zandvoort2023:        { id:"zandvoort",    name:"Circuit Zandvoort",                  short:"ZAN", country:"Países Bajos",    lengthKm:4.259, turns:14, layout:"Grand Prix" },
  ks_nurburgring:       { id:"nurburgring",  name:"Nürburgring Grand Prix",             short:"NUR", country:"Alemania",        lengthKm:5.148, turns:15, layout:"Grand Prix" },
  fn_hungaroring:       { id:"hungaroring",  name:"Hungaroring",                        short:"HUN", country:"Hungría",         lengthKm:4.381, turns:14, layout:"Grand Prix" },
  ks_brands_hatch:      { id:"brandshatch",  name:"Brands Hatch",                       short:"BRH", country:"Reino Unido",     lengthKm:3.908, turns:9,  layout:"Grand Prix" },
  fn_redbullring:       { id:"redbullring",  name:"Red Bull Ring",                      short:"RBR", country:"Austria",         lengthKm:4.326, turns:10, layout:"Grand Prix" },
  spa:                  { id:"spa",          name:"Circuit de Spa-Francorchamps",        short:"SPA", country:"Bélgica",         lengthKm:7.004, turns:20, layout:"Grand Prix" },
  vrc_mexico:           { id:"mexico",       name:"Autódromo Hermanos Rodríguez",        short:"MEX", country:"México",          lengthKm:4.304, turns:17, layout:"Grand Prix" },
  rt_suzuka:            { id:"suzuka",       name:"Suzuka Circuit",                      short:"SUZ", country:"Japón",           lengthKm:5.807, turns:18, layout:"Grand Prix" },
  monza:                { id:"monza",        name:"Autodromo Nazionale di Monza",        short:"MON", country:"Italia",          lengthKm:5.793, turns:11, layout:"Grand Prix" },
  lasvegas23:           { id:"lasvegas",     name:"Las Vegas Strip Circuit",             short:"LVS", country:"EE.UU.",          lengthKm:6.201, turns:17, layout:"Callejero" },
};

function getTrack(acId) {
  return TRACKS[acId] ?? { id: acId, name: acId, short: acId.slice(0,3).toUpperCase(), country:"?", lengthKm:0, turns:0, layout:"?" };
}

function fmtDate(iso) {
  // "2025-02-15T23:45:00-05:00" → "15 Feb 2025"
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("es-ES", { day:"2-digit", month:"short", year:"numeric" });
}

// ── Class ID normalisation ────────────────────────────────────────────────
const CLASS_ID_MAP = {
  "d61878c7-1d72-488a-846b-23181f5dce02": "indycar",
  "bc3ad3cb-6eb1-4948-9f82-6a271474af17": "am",
};

function normaliseClassId(uuid) {
  return CLASS_ID_MAP[uuid] ?? uuid;
}

function extractClasses(champRaw) {
  return (champRaw.Classes || []).map(cl => {
    const firstEntrant = Object.values(cl.Entrants || {})[0];
    return {
      id:    normaliseClassId(cl.ID),
      label: cl.Name,
      car:   firstEntrant?.Model || "",
    };
  });
}

// ── Driver registry (seeded GUIDs for stable IDs across seasons) ──────────
const SEEDED_GUIDS = {
  "76561199141189138": "d01", // Samir Kaddoura
  "76561199012707732": "d02", // Ameg Sanchez
  "40904243":          "d03", // Pablo Nacianceno
  "4090424":           "d04", // Deivid Lamadrid
  "76561198295164314": "d05", // Brayan Couso
  "76561199526886216": "d06", // Ivan Enriquez
  "76561199574088119": "d07", // Oliver Wilson
  "76561199380473036": "d08", // Eduardo A. Gibert (S02 account)
  "76561199087661347": "d08", // Eduardo A. Gibert (S03 account)
  "76561199822043307": "d09", // Erick Gonzalez
  "76561199433405491": "d10", // Marco Veranes
  "76561199147153347": "d11", // Lázaro Contreras
  "76561199056376750": "d12", // Yonny Menglez
  "76561199805169937": "d13", // Alicia Santos
  "76561198818042592": "d14", // Kiko Hernandez
  "76561199063072779": "d15", // Alejandro Sotolongo
};

let driverCounter = 16;
const guidToId    = new Map(Object.entries(SEEDED_GUIDS));
const driverMeta  = new Map(); // id → {name, guid, nation, teamId}

function getOrCreateDriverId(guid, name, nation, teamId) {
  if (!guidToId.has(guid)) {
    guidToId.set(guid, `d${String(driverCounter++).padStart(2,"0")}`);
  }
  const id = guidToId.get(guid);
  driverMeta.set(id, { name, guid, nation: nation || "—", teamId: teamId || "" });
  return id;
}

// Build teams + GUID→teamId from a championship's entrant lists.
function extractTeams(champRaw) {
  const seen    = new Map();
  const teams   = [];
  const guidMap = new Map();

  for (const cl of (champRaw.Classes || [])) {
    for (const entrant of Object.values(cl.Entrants || {})) {
      const rawName = (entrant.Team || "").trim();
      if (rawName) {
        const key = rawName.toLowerCase();
        if (!seen.has(key)) {
          const id = "t-" + key.replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
          seen.set(key, id);
          teams.push({ id, name: rawName });
        }
        if (entrant.GUID) guidMap.set(entrant.GUID, seen.get(key));
      }
    }
  }
  return { teams, guidToTeam: guidMap };
}

// Walk a championship's entrants and seed/update the driver registry.
function registerEntrants(champRaw, guidTeamMap) {
  for (const cl of (champRaw.Classes || [])) {
    for (const entrant of Object.values(cl.Entrants || {})) {
      const guid = entrant.GUID;
      if (!guid) continue;
      const tId = guidTeamMap.get(guid) ?? "";
      getOrCreateDriverId(guid, entrant.Name || guid, entrant.Country || "—", tId);
    }
  }
}

// ── Empty session shell ───────────────────────────────────────────────────
const EMPTY_CONDITIONS = { airTemp: 0, trackTemp: 0, weather: "—" };

function emptyShell(roundId, type, subLabel) {
  const suffix = type === "qualifying" ? "q" : type === "practice" ? "p" : (subLabel?.toLowerCase() ?? "r");
  return {
    id: `${roundId}-${suffix}`,
    type,
    ...(subLabel ? { subLabel } : {}),
    status: "upcoming",
    conditions: EMPTY_CONDITIONS,
    results: [],
    laps: [],
    incidents: [],
  };
}

// ── Round skeleton builder ────────────────────────────────────────────────
// For both legacy event format (S01) and race_weekends format (S02+) we just
// emit the round + empty session shells. Track + date come from the AC export
// (best-effort fallbacks).

function legacyRounds(champId, events) {
  const rounds = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const acTrack = ev.RaceSetup?.Track;
    if (!acTrack) continue;
    const roundIdx = i + 1;
    const roundId  = `${champId}-r${String(roundIdx).padStart(2, "0")}`;
    const date     = ev.CompletedTime ? fmtDate(ev.CompletedTime) : "—";

    rounds.push({
      id: roundId,
      index: roundIdx,
      status: "upcoming",
      date,
      track: getTrack(acTrack),
      sessions: [
        emptyShell(roundId, "qualifying"),
        emptyShell(roundId, "race", "R1"),
        emptyShell(roundId, "race", "R2"),
      ],
    });
  }
  return rounds;
}

function rwRounds(champId, rwIds, rwDir) {
  const rounds = [];
  let roundIdx = 1;

  for (const rwId of rwIds) {
    if (!rwId) { roundIdx++; continue; }
    const rwPath = path.join(rwDir, `${rwId}.json`);
    if (!fs.existsSync(rwPath)) { roundIdx++; continue; }
    const rw = readJson(rwPath);

    let acTrack = null, roundDate = null;
    for (const s of (rw.Sessions || [])) {
      if (s.Results?.TrackName) {
        acTrack = s.Results.TrackName;
        roundDate = s.Results.Date;
        break;
      }
    }
    if (!acTrack && rw.Sessions?.[0]?.RaceConfig?.Track) {
      acTrack = rw.Sessions[0].RaceConfig.Track;
    }
    if (!acTrack) { roundIdx++; continue; }

    const roundId = `${champId}-r${String(roundIdx).padStart(2,"0")}`;
    rounds.push({
      id: roundId,
      index: roundIdx,
      status: "upcoming",
      date: roundDate ? fmtDate(roundDate) : "—",
      track: getTrack(acTrack),
      sessions: [
        emptyShell(roundId, "qualifying"),
        emptyShell(roundId, "race", "R1"),
        emptyShell(roundId, "race", "R2"),
      ],
    });
    roundIdx++;
  }
  return rounds;
}

// ── Default points table (applies to all seasons unless overridden) ───────
const DEFAULT_POINTS = {
  r1: [25, 18, 15, 12, 10, 8, 6, 4],
  r2: [37.5, 27, 22.5, 18, 15, 12, 9],
  fastestLapR1: 1,
  fastestLapR2: 1.5,
};

// ── Main ──────────────────────────────────────────────────────────────────
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const NO_TEAMS = new Map();

// S01 — legacy event format
const s01raw     = readJson(path.join(CH, "s012024.json"));
const s01Classes = extractClasses(s01raw);
registerEntrants(s01raw, NO_TEAMS);
const s01Rounds  = legacyRounds("cnsrc-s01", s01raw.Events || []);

// S02 — race_weekends format
const s02raw     = readJson(path.join(CH, "s022025.json"));
const s02Classes = extractClasses(s02raw);
registerEntrants(s02raw, NO_TEAMS);
const s02rwIds   = s02raw.Events.map(e => e.RaceWeekendID).filter(id => id && id !== ZERO_UUID);
const s02Rounds  = rwRounds("cnsrc-s02", s02rwIds, RW);

// S03 — race_weekends format with teams
const s03raw     = readJson(path.join(CH, "s032026.json"));
const s03Classes = extractClasses(s03raw);
const { teams: s03Teams, guidToTeam: s03GuidTeam } = extractTeams(s03raw);
registerEntrants(s03raw, s03GuidTeam);
const s03rwIds   = s03raw.Events.map(e => e.RaceWeekendID).filter(id => id && id !== ZERO_UUID);
const s03Rounds  = rwRounds("cnsrc-s03", s03rwIds, RW);

// ── Build outputs ─────────────────────────────────────────────────────────
const drivers = [];
for (const [id, meta] of driverMeta) {
  const num = parseInt(id.replace("d", ""));
  drivers.push({
    id, name: meta.name, number: String(num),
    country: meta.nation || "—",
    teamId: meta.teamId, license: "A", joined: "2024",
  });
}

const driversOut = { drivers, teams: s03Teams };
const tracksOut  = { tracks: Object.values(TRACKS) };

const s01Out = {
  id: "cnsrc-s01", name: "Campeonato Nacional Simracing Cuba 2024",
  season: "S01", year: 2024, status: "complete",
  classes: s01Classes,
  pointsTable: DEFAULT_POINTS,
  rounds: s01Rounds,
};
const s02Out = {
  id: "cnsrc-s02", name: "Campeonato Nacional Simracing Cuba 2025",
  season: "S02", year: 2025, status: "complete",
  classes: s02Classes,
  pointsTable: DEFAULT_POINTS,
  rounds: s02Rounds,
};
const s03Out = {
  id: "cnsrc-s03", name: "Campeonato Nacional Simracing Cuba 2026",
  season: "S03", year: 2026, status: "live",
  classes: s03Classes,
  pointsTable: DEFAULT_POINTS,
  rounds: s03Rounds,
};

fs.writeFileSync(path.join(DEST, "drivers.json"),   JSON.stringify(driversOut, null, 2), "utf8");
fs.writeFileSync(path.join(DEST, "tracks.json"),    JSON.stringify(tracksOut,  null, 2), "utf8");
fs.writeFileSync(path.join(DEST, "cnsrc-s01.json"), JSON.stringify(s01Out, null, 2), "utf8");
fs.writeFileSync(path.join(DEST, "cnsrc-s02.json"), JSON.stringify(s02Out, null, 2), "utf8");
fs.writeFileSync(path.join(DEST, "cnsrc-s03.json"), JSON.stringify(s03Out, null, 2), "utf8");

console.log(`✓ drivers.json written  (${drivers.length} drivers, ${s03Teams.length} teams)`);
console.log(`✓ tracks.json written   (${tracksOut.tracks.length} tracks)`);
console.log(`✓ cnsrc-s01.json shell written (${s01Rounds.length} rounds)`);
console.log(`✓ cnsrc-s02.json shell written (${s02Rounds.length} rounds)`);
console.log(`✓ cnsrc-s03.json shell written (${s03Rounds.length} rounds)`);
console.log("");
console.log("⚠ This script writes EMPTY session shells. Re-run with caution if existing");
console.log("  championships already have ingested race data — sessions will be wiped.");
console.log("  Per-session results/laps/incidents are populated by the race-data ingestion");
console.log("  pipeline at /admin/championships/[id]/rounds/[roundId].");
