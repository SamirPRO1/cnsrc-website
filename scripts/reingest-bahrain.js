// One-off: re-ingest the two Bahrain race files into cnsrc-s03.json
// using the new full ingestor (laps + results + incidents + conditions).
// Run: node scripts/reingest-bahrain.js
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const guidMap = require(path.join(ROOT, "data/driver-guids.json"));
const classMap = require(path.join(ROOT, "data/class-uuids.json"));
const driversFile = require(path.join(ROOT, "data/drivers.json"));

const SPECTATOR = "00000000-0000-0000-0000-000000000000";
const TYRE_MAP = { S: "S", M: "M", H: "H", I: "I", W: "W" };

function msToLapString(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0.000";
  const mins = Math.floor(ms / 60000);
  const sec = (ms - mins * 60000) / 1000;
  if (mins === 0) return sec.toFixed(3);
  return mins + ":" + sec.toFixed(3).padStart(6, "0");
}

function formatGap(d) {
  if (d <= 0) return "—";
  if (d < 60000) return "+" + (d / 1000).toFixed(3);
  const m = Math.floor(d / 60000);
  const s = (d - m * 60000) / 1000;
  return "+" + m + ":" + s.toFixed(3).padStart(6, "0");
}

const teamNameToId = {};
for (const t of driversFile.teams) teamNameToId[t.name.toLowerCase()] = t.id;
const driverIdToTeam = new Map();
for (const d of driversFile.drivers) driverIdToTeam.set(d.id, d.teamId);

function resolveTeamId(car, driverId) {
  const n = (car.Driver.Team || "").trim().toLowerCase();
  if (n && teamNameToId[n]) return teamNameToId[n];
  return driverIdToTeam.get(driverId) || "";
}

function ingestLaps(race) {
  const lapsByCar = new Map();
  for (const l of race.Laps) {
    if (l.ClassID === SPECTATOR) continue;
    if (!lapsByCar.has(l.CarId)) lapsByCar.set(l.CarId, []);
    lapsByCar.get(l.CarId).push(l);
  }
  for (const arr of lapsByCar.values()) arr.sort((a, b) => a.Timestamp - b.Timestamp);
  const out = [];
  for (const [carId, arr] of lapsByCar) {
    const car = race.Cars.find((c) => c.CarId === carId);
    if (!car) continue;
    const driverId = guidMap[car.Driver.Guid];
    if (!driverId) continue;
    arr.forEach((rl, idx) => {
      const sectors = rl.Sectors.length === 3 ? rl.Sectors : [0, 0, 0];
      out.push({
        driverId,
        lapNo: idx + 1,
        time: msToLapString(rl.LapTime),
        sectors: [msToLapString(sectors[0]), msToLapString(sectors[1]), msToLapString(sectors[2])],
        compound: TYRE_MAP[rl.Tyre] || "M",
        cut: rl.Cuts > 0,
      });
    });
  }
  return out;
}

function ingestResults(race, pointsTable, isRace2) {
  const isQual = race.Type === "QUALIFY";
  const byClass = new Map();
  for (const r of race.Result) {
    if (r.ClassID === SPECTATOR) continue;
    const car = race.Cars.find((c) => c.CarId === r.CarId);
    if (!car) continue;
    const driverId = guidMap[car.Driver.Guid];
    if (!driverId) continue;
    const normClass = classMap[r.ClassID] || r.ClassID;
    const teamId = resolveTeamId(car, driverId);
    const enriched = { ...r, driverId, teamId };
    if (!byClass.has(normClass)) byClass.set(normClass, []);
    byClass.get(normClass).push(enriched);
  }
  const out = [];
  for (const [classId, entries] of byClass) {
    if (isQual) {
      entries.sort((a, b) => {
        if (a.BestLap <= 0) return 1;
        if (b.BestLap <= 0) return -1;
        return a.BestLap - b.BestLap;
      });
      entries.forEach((e, i) => {
        const pos = i + 1;
        const gap =
          i === 0
            ? "—"
            : e.BestLap > 0 && entries[0].BestLap > 0
            ? formatGap(e.BestLap - entries[0].BestLap)
            : "--";
        out.push({
          driverId: e.driverId, teamId: e.teamId, classId,
          pos, gridPos: pos,
          bestLap: msToLapString(e.BestLap),
          gap, points: 0, status: "finished",
        });
      });
      continue;
    }
    entries.sort((a, b) =>
      b.NumLaps !== a.NumLaps ? b.NumLaps - a.NumLaps : (a.TotalTime || Infinity) - (b.TotalTime || Infinity),
    );
    const winnerLaps = entries[0]?.NumLaps ?? 0;
    const winnerTime = entries[0]?.TotalTime ?? 0;
    const fastest = [...entries].filter((e) => e.BestLap > 0).sort((a, b) => a.BestLap - b.BestLap)[0];
    entries.forEach((e, i) => {
      const pos = i + 1;
      const isDnf = e.Disqualified || (winnerLaps > 1 && e.NumLaps < winnerLaps * 0.6);
      const isFl = fastest && e.driverId === fastest.driverId;
      let gap;
      if (i === 0) gap = "—";
      else if (isDnf) {
        const ld = winnerLaps - e.NumLaps;
        gap = "+" + ld + " Vlt" + (ld !== 1 ? "s" : "");
      } else gap = formatGap(e.TotalTime - winnerTime);
      let points = 0;
      if (pointsTable && !isDnf) {
        const arr = isRace2 ? pointsTable.r2 : pointsTable.r1;
        const base = arr[pos - 1] || 0;
        const flBonus = isFl ? (isRace2 ? pointsTable.fastestLapR2 : pointsTable.fastestLapR1) : 0;
        points = base + flBonus;
      }
      out.push({
        driverId: e.driverId, teamId: e.teamId, classId,
        pos, gridPos: e.GridPosition || pos,
        bestLap: msToLapString(e.BestLap),
        gap, points,
        status: e.Disqualified ? "dsq" : isDnf ? "dnf" : "finished",
      });
    });
  }
  return out;
}

function ingestIncidents(race) {
  if (!race.Events?.length) return [];
  const lapsByCar = new Map();
  for (const l of race.Laps) {
    if (l.ClassID === SPECTATOR) continue;
    if (!lapsByCar.has(l.CarId)) lapsByCar.set(l.CarId, []);
    lapsByCar.get(l.CarId).push(l);
  }
  for (const arr of lapsByCar.values()) arr.sort((a, b) => a.Timestamp - b.Timestamp);

  function lapNumberAt(carId, ts) {
    const arr = lapsByCar.get(carId);
    if (!arr || !arr.length) return 1;
    let c = 0;
    for (const l of arr) {
      if (l.Timestamp <= ts) c++;
      else break;
    }
    return Math.max(1, c + 1);
  }

  const seen = new Set();
  const out = [];
  for (const ev of race.Events) {
    if (ev.AfterSessionEnd) continue;
    if (ev.Type !== "COLLISION_WITH_CAR" && ev.Type !== "COLLISION_WITH_ENV") continue;
    const guidA = ev.Driver?.Guid;
    const guidB = ev.OtherDriver?.Guid;
    const key = [guidA, guidB || "wall", Math.floor(ev.Timestamp / 5)].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const dA = guidA ? guidMap[guidA] : undefined;
    if (!dA) continue;
    const driverIds = [dA];
    if (guidB && guidMap[guidB]) driverIds.push(guidMap[guidB]);
    const lap = lapNumberAt(ev.CarId, ev.Timestamp);
    const summary =
      ev.Type === "COLLISION_WITH_ENV"
        ? (ev.Driver?.Name || "?") + " contra barrera"
        : "Contacto entre " + (ev.Driver?.Name || "?") + " y " + (ev.OtherDriver?.Name || "?");
    out.push({ lap, kind: "collision", driverIds, summary });
  }
  return out.sort((a, b) => a.lap - b.lap);
}

function pickConditions(race) {
  const first = race.Laps.find((l) => l.Conditions);
  if (!first?.Conditions) return { airTemp: 0, trackTemp: 0, weather: "—" };
  const c = first.Conditions;
  const wet = (c.RainIntensity || 0) > 0.05;
  const out = {
    airTemp: Math.round(c.Ambient),
    trackTemp: Math.round(c.Road),
    weather: wet ? "Lluvia" : "Despejado",
  };
  if (typeof c.WindSpeed === "number") out.windKph = Math.round(c.WindSpeed);
  return out;
}

const champPath = path.join(ROOT, "data/cnsrc-s03.json");
const champ = JSON.parse(fs.readFileSync(champPath, "utf8"));
const r1Race = require(path.join(ROOT, "data/races/2026_4_12_16_24_RACE.json"));
const r2Race = require(path.join(ROOT, "data/races/2026_4_12_16_58_RACE.json"));

function applyTo(sessId, race, raceFilename, isRace2) {
  for (const round of champ.rounds) {
    const sess = round.sessions.find((s) => s.id === sessId);
    if (!sess) continue;
    sess.laps = ingestLaps(race);
    sess.results = ingestResults(race, champ.pointsTable, isRace2);
    sess.incidents = ingestIncidents(race);
    sess.conditions = pickConditions(race);
    sess.raceDataFile = raceFilename;
    if (round.status === "upcoming") round.status = "done";
    if (sess.status === "upcoming") sess.status = "done";
    console.log(`${sessId} → ${sess.laps.length} laps, ${sess.results.length} results, ${sess.incidents.length} incidents`);
    return;
  }
  console.log("NOT FOUND:", sessId);
}

applyTo("cnsrc-s03-r02-r1", r1Race, "2026_4_12_16_24_RACE.json", false);
applyTo("cnsrc-s03-r02-r2", r2Race, "2026_4_12_16_58_RACE.json", true);

fs.writeFileSync(champPath, JSON.stringify(champ, null, 2));
console.log("Saved.");
