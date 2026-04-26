# Race Data Format

Reference for the AC Server Manager race export JSON files in this folder. The goal is to ingest one of these per championship race and surface every useful metric on the website.

## File naming

`YYYY_M_D_HH_MM_RACE.json` — server-local timestamp of when the session started. It is **not** a unique race ID; pair it with `ChampionshipID` + `RaceWeekendID` + `EventName` to disambiguate.

## Top-level keys

| Field            | Type     | Description |
|------------------|----------|-------------|
| `Version`        | number   | Export schema version (currently `7`) |
| `Cars`           | array    | Every car that entered the session (incl. DNS, retired, and any non-racing entry like a `TV` spectator car) |
| `Events`         | array    | Discrete in-race events (collisions). Empty/absent for clean sessions |
| `Laps`           | array    | Every flying lap recorded by every car |
| `Result`         | array    | Final classified finishers, in finishing order |
| `Penalties`      | array\|null | Post-race penalties (often `null`) |
| `TrackName`      | string   | AC track folder name, e.g. `fn_bahrain` |
| `TrackConfig`    | string   | Track layout/variant, e.g. `f1` |
| `Type`           | string   | `RACE` / `QUALIFY` / `PRACTICE` |
| `Date`           | string   | ISO-8601 with TZ offset, e.g. `2026-04-12T16:24:00-04:00` |
| `SessionFile`    | string   | Same stem as the filename |
| `SessionConfig`  | object   | Server-side session rules — see below |
| `ChampionshipID` | UUID     | AC Server Manager championship UUID |
| `RaceWeekendID`  | UUID     | Race weekend UUID (groups Q + R1 + R2 etc.) |
| `EventName`      | string   | Human label, e.g. `Race Weekend: R2 Bahrain` |

### `SessionConfig`

```json
{
  "session_type": 3,        // 1=practice, 2=qualifying, 3=race
  "name": "Race",
  "time": 0,                // minutes; 0 means lap-limited
  "laps": 7,                // total race distance
  "is_open": 1,             // joining mid-session allowed
  "wait_time": 300,         // grid wait seconds
  "visibility_mode": 0,
  "qualifying_type": 0,
  "qualifying_number_of_laps_to_average": 0,
  "count_out_lap": false,
  "disable_push_to_pass": false
}
```

**Use it for**: race format chip (`7 LAPS` / `25 MIN`), whether qualifying was averaged, push-to-pass availability.

---

## `Cars[]` — entry list

```json
{
  "BallastKG": 0,
  "CarId": 0,                   // assigned slot for this session, NOT a stable driver ID
  "Driver": {
    "Guid": "76561199012707732", // Steam GUID — the real stable driver identifier
    "GuidsList": ["76561199012707732"],
    "Name": "Ameg Sanchez",
    "Nation": "CUB",             // ISO-3 country code
    "Team": "Team Pote",
    "ClassID": "d61878c7-1d72-488a-846b-23181f5dce02"
  },
  "Model": "rss_formula_rss_3_v6_2026",
  "Restrictor": 0,
  "Skin": "ameg_sanchez_27",     // "<slug>_<carNumber>"; trailing digits = race number
  "ClassID": "d61878c7-...",     // same uuid as Driver.ClassID; map to indycar/am
  "MinPing": 40,
  "MaxPing": 165
}
```

### Notes & gotchas

- **`CarId` is per-session**, so always join across `Cars`/`Laps`/`Result`/`Events` by `CarId` *within the same file*. For cross-session driver identity, use `DriverGuid`.
- **`Skin`** typically encodes the race number after the last underscore — useful when the registry doesn't carry per-event numbers (e.g. `ameg_sanchez_27` → #27).
- **`ClassID`** is a UUID; you must map it to your domain class IDs (`indycar`, `am`). Class definitions live in the championship JSON.
- **Spectator/admin cars** appear here too, with `Driver.Name === "TV"`, `ClassID = "00000000-..."`, and a non-race `Model` (e.g. `aston_vantage2018`). **Filter these out** before counting starters.
- **`MinPing` / `MaxPing`** wide spread (e.g. 333 → 369, or 58 → 1522) is a reliable connection-quality signal — surface as a "connection issues" badge on the driver row.

### Derivable

- **Starters count** = `Cars.filter(c => c.ClassID !== "00000000-...")` length
- **Per-class entry count**
- **Team representation** for the round
- **Connection quality flags** when `MaxPing - MinPing > 100ms`

---

## `Laps[]` — every flying lap

```json
{
  "CarId": 0,
  "DriverGuid": "76561199012707732",
  "DriverName": "Ameg Sanchez",
  "CarModel": "rss_formula_rss_3_v6_2026",
  "ClassID": "d61878c7-...",
  "BallastKG": 0,
  "Restrictor": 0,
  "LapTime": 110414,            // milliseconds
  "Sectors": [36344, 46823, 27247],  // milliseconds, length 3
  "Cuts": 0,                    // number of track cuts on this lap
  "Tyre": "S",                  // S/M/H/I/W
  "Timestamp": 1776024737,      // unix seconds when the lap was completed
  "ContributedToFastestLap": false,  // see warning below
  "SpeedTrapHits": null,        // null in current data
  "Conditions": {
    "Ambient": 25,              // air temp °C
    "Road": 36,                 // track temp °C
    "Grip": 1,                  // 0..1
    "WindSpeed": 11,            // kph
    "WindDirection": 39,        // degrees
    "RainIntensity": 0,
    "RainWetness": 0,
    "RainWater": 0
  }
}
```

### `ContributedToFastestLap` warning

In the sample data this flag is set on **every driver's personal best** (count = number of finishers), **not** the single overall fastest. It marks "this is this driver's PB lap of the session". Compute the actual race fastest lap yourself by `min(LapTime)` filtered to valid laps.

### Validity rules

- A lap is **valid** when `Cuts === 0` and `LapTime > 0`. Invalid laps are recorded but should be excluded from PB / fastest-lap calculations.
- The first stint typically has an out-lap with an inflated `LapTime` and a much larger sector 1; use `LapTime > 1.3 × median` as a heuristic if you need to flag it.

### Derivable per driver

- **Personal best lap** + **best sector times** (theoretical best lap = sum of best sectors)
- **Lap-by-lap delta** to leader / to PB
- **Pace consistency** = stddev of valid lap times
- **Tyre stints** by `Tyre` value transitions across consecutive laps → **pit stop count** and stop-lap detection (the lap with a sudden `LapTime` spike between two stints)
- **Stint length** in laps per compound
- **Average lap time per stint** → tyre degradation curve
- **Speed trap** placeholder exists (`SpeedTrapHits`); not populated in current files

### Derivable per session

- **Fastest lap of the race** + driver/team/lap number/tyre
- **Fastest lap per class**
- **Fastest sector 1 / 2 / 3** with driver attribution → **theoretical best lap**
- **Weather/track evolution**: aggregate `Conditions.Grip`, `Road` temp, rain values across the lap timeline. Note: in the sample data `Conditions` is identical for every lap (static weather), but the schema supports per-lap evolution
- **Lap-position chart** (classic F1 race progression): build from `Timestamp` deltas + `LapTime` accumulation
- **Race-time leaderboard** at end of any given lap

---

## `Result[]` — classified finishers

```json
{
  "CarId": 0,
  "DriverGuid": "76561199012707732",
  "DriverName": "Ameg Sanchez",
  "CarModel": "rss_formula_rss_3_v6_2026",
  "ClassID": "d61878c7-...",
  "BallastKG": 0,
  "Restrictor": 0,
  "BestLap": 107410,          // ms — driver's PB this race
  "TotalTime": 762072,        // ms — full race time including penalties
  "NumLaps": 7,
  "GridPosition": 1,          // 1-indexed; pole = 1
  "HasPenalty": false,
  "PenaltyTime": 0,           // ms added to TotalTime
  "LapPenalty": 0,            // laps deducted
  "Disqualified": false
}
```

### Critical points

- **`Result` is in finishing order** — array index 0 = winner, index 1 = P2, etc. Compute `pos` from index.
- **`Result.length < Cars.length`** when drivers DNF/DNS. Cars present in `Cars` but missing from `Result` are unclassified (DNF/DNS/DSQ-as-removed). Your DNF list = `Cars - Result - {spectators}`.
- **`Disqualified: true`** means the driver was DSQ'd but still appears in the result (with their last classified time).
- **Position change** = `GridPosition - (resultIndex + 1)`; positive means gained places.
- **Gap to leader** = `Result[i].TotalTime - Result[0].TotalTime`. If a backmarker was lapped, you need to detect this from `NumLaps < leader.NumLaps` and present `+N LAP` instead of a time gap.

### Derivable

- **Race winner**, podium (top 3)
- **Per-class results** by partitioning by `ClassID`
- **Largest position gainer / loser** (for the "Driver of the Day"-style stat)
- **Average position change**
- **Penalty summary** (who got hit, how much)
- **Disqualifications**
- **Points attribution** — apply your championship's points table to the per-class finishing order, plus fastest-lap bonus

---

## `Events[]` — collisions

```json
{
  "Type": "COLLISION_WITH_CAR",   // or COLLISION_WITH_ENV
  "CarId": 1,
  "Driver": { ...full driver block... },
  "OtherCarId": 2,
  "OtherDriver": { ...full driver block, or zero-GUID block for ENV collisions... },
  "ImpactSpeed": 27.8613,         // m/s — multiply by 3.6 for kph
  "RelPosition": { "X": -0.58, "Y": -0.09, "Z": 2.76 },  // relative to other car
  "WorldPosition": { "X": 180.5, "Y": 10.2, "Z": 454.0 }, // world space
  "Timestamp": 1776024642,        // unix seconds
  "AfterSessionEnd": false        // true = "in-laps" / cool-down crash; usually filter out
}
```

### Notes

- For `COLLISION_WITH_ENV` (wall hit), `OtherDriver` is a zero/empty block with `ClassID = "00000000-..."` — treat as "wall" in the UI.
- **Lap number** is not stored on the event. Compute it by finding the most recent `Laps` entry for `CarId` with `Lap.Timestamp <= Event.Timestamp`, then `lapNumber = laps_completed_at_that_point + 1` (the event happened *during* the lap that was about to be completed).
- **Severity** can be derived from `ImpactSpeed`: e.g. `<10 m/s` = light tap, `>25 m/s` = major incident.
- **Initiator vs victim**: the event is logged twice when both cars were tracking — the file in this folder usually only contains the initiator's record. Don't double-count.
- **`AfterSessionEnd: true`** events should be excluded from incident tallies and replays.

### Derivable

- **Incident count** per race / per driver / per lap
- **Incident heatmap** using `WorldPosition.X` and `WorldPosition.Z` over a track outline
- **"Cleanest driver"** stat (zero collisions across N races)
- **First-corner chaos meter** (incidents in the first 30 seconds)
- **Wall-hit vs car-contact split**
- **Highest-impact incidents** (sorted by `ImpactSpeed`)

---

## `Penalties[]`

`null` in the current sample. When populated, expect AC's standard penalty payload (drive-through, time, lap deduction). Treat `Result.HasPenalty/PenaltyTime/LapPenalty` as the authoritative post-race state.

---

## Cross-session derivations

When you have all sessions of a weekend (Practice / Q / R1 / R2):

- **Qualifying-to-race delta**: `Q.bestLap` vs `R.bestLap` per driver (fuel-corrected pace estimate)
- **Grid order** for R2 from R1's reverse-top-N rule (depends on series regs — not encoded in the file, must come from championship config)
- **Weekend champion** of the round = lowest aggregated finishing position
- **DNF carryover** if R2's grid follows R1's classification

---

## Suggested website surfaces

| Page                  | New widgets enabled by this data |
|-----------------------|----------------------------------|
| Session detail        | Lap-by-lap chart, sector ranking, tyre stint bars, incident timeline + heatmap, penalty list, weather strip |
| Driver profile        | Per-race lap traces, consistency score, incident history, average start vs finish |
| Track detail          | All-time fastest sector splits, incident hotspots overlaid on the track |
| Championship overview | Races completed, total laps, total incidents, average DNF rate |
| Live race ticker      | If files are dropped during a session, real-time gap, last-lap times, latest incidents |

---

## Ingestion strategy (current implementation)

The pipeline is implemented in [lib/admin/ingestRaceData.ts](../../lib/admin/ingestRaceData.ts):

1. Drop the race JSON in `data/races/` (filenames stay as the AC export named them)
2. From the admin UI (`/admin/championships/[id]/rounds/[roundId]`), expand the target session and use the **Datos de carrera** panel to pick the file and click **Ingerir**
3. `ingestRaceFile(race, opts)` returns `{ laps, results, incidents, conditions }`:
   - **Filters spectator cars** (`ClassID === "00000000-..."`)
   - **Maps `DriverGuid` → driverId** via [data/driver-guids.json](../driver-guids.json)
   - **Maps `ClassID` UUID → "indycar"/"am"** via [data/class-uuids.json](../class-uuids.json)
   - **Picks team** by name match against `drivers.json` teams, falling back to the driver registry's `teamId`
   - **Computes points** from the championship's `pointsTable` (R1/R2 arrays + FL bonus) — DNF/DSQ score zero
   - **Derives incident lap numbers** by walking each car's `Laps[]` and counting timestamps `<= Event.Timestamp`
   - **Picks conditions** from the first lap's `Conditions` block; rain detection via `RainIntensity > 0.05`
4. The route handler writes the result back to the championship JSON, sets `session.raceDataFile`, and flips status from `upcoming` → `done`

The raw file stays untouched — derived values can always be recomputed by re-ingesting.

**Add a new derived metric** by extending the appropriate function in `ingestRaceData.ts` — `ingestRaceLaps`, `ingestRaceResults`, `ingestRaceIncidents`, or `pickConditions` — and surfacing it on the session detail page.

## Open questions / data-quality notes from the sample

- `Penalties` is `null` even though `Result[].HasPenalty` exists — the per-result fields are the only penalty signal in this export.
- `ContributedToFastestLap` is per-driver, not per-session. Don't trust it for the race FL.
- All laps share identical `Conditions` in the sample — confirm whether dynamic weather sessions vary this per-lap before building weather-evolution charts.
- `SpeedTrapHits` is `null` in every lap — speed-trap data isn't enabled on the server. If it gets enabled, expect an array of `{ position, speed }` points.
