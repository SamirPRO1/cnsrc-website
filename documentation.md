# CNSRC — Developer Documentation

The Cuban National Simracing Championship (CNSRC) website. A Next.js 16 app that displays multi-season championship data for an Assetto Corsa league: drivers, teams, tracks, results, lap analysis, and per-race telemetry.

If you're new here, **read the whole file once** before changing anything. Several things in this stack are not the defaults.

---

## 1. Stack

| Piece           | Version | Notes |
|-----------------|---------|-------|
| Next.js         | 16.2.4  | App Router. **This is not the Next.js you might know — read `node_modules/next/dist/docs/` before adding routes or APIs.** Notably: `params` in route handlers and dynamic pages is a `Promise`. |
| React           | 19.2    | |
| TypeScript      | 5.x     | strict mode |
| Tailwind CSS    | 4.x     | via `@tailwindcss/postcss`; tokens live in [app/globals.css](app/globals.css) under `@theme inline` |
| Zod             | 4.x     | every data shape has a schema in [lib/types/index.ts](lib/types/index.ts) |
| Recharts        | 3.8     | used for the position-by-lap chart |
| pnpm            | 10+     | package manager (install via `npm install -g pnpm` if you don't have it) |

---

## 2. Get it running

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # static build
pnpm lint
npx tsc --noEmit  # type check
```

The data layer reads JSON files at module load (see §4). After editing files in `data/`, restart the dev server to pick them up.

---

## 3. Project layout

```
app/
  layout.tsx                         # Root layout, font wiring
  page.tsx                           # Home (active championship hero)
  globals.css                        # Design tokens + utility classes
  championships/[id]/page.tsx        # Championship standings + calendar
  drivers/                           # Driver index + profile
  tracks/                            # Track index + detail
  records/                           # Global records
  sessions/[id]/page.tsx             # Session detail (results, lap analysis, position chart)
  (admin)/
    layout.tsx                       # Admin shell — sidebar nav, no public-site visuals
    admin/
      page.tsx                       # Dashboard
      drivers|teams|tracks/page.tsx  # CRUD pages
      championships/[id]/...         # Championship + round + session management
  api/admin/                         # REST endpoints for admin (see §6)

components/
  ui/        # Public-site primitives: Glass, Backdrop, TopNav, DataTable, PodiumGroup, ...
  admin/     # Admin primitives + entity forms + race-data panel
  session/   # Session-detail tabs (results-with-laps, consistency, positions chart)

lib/
  types/index.ts        # Zod schemas + TS types — single source of truth
  store/index.ts        # In-memory store built from JSON files at module load
  data/index.ts         # Cached, derived public-site data accessors
  derive/               # Pure functions: standings, track records, lap analysis
  admin/                # Server-only file I/O + race ingestion + client fetch hook

data/
  drivers.json          # { drivers: [...], teams: [...] }
  tracks.json           # { tracks: [...] }
  cnsrc-s01.json        # championship JSONs (one per season)
  cnsrc-s02.json
  cnsrc-s03.json
  driver-guids.json     # Steam GUID → driverId mapping (used by race ingestion)
  class-uuids.json      # AC class UUID → normalized class id (indycar/am)
  races/
    racedata.md         # Reference for the AC race-export JSON format — read before touching ingestion
    *.json              # raw AC race exports, one per session

public/
  drivers/*.png         # driver photos referenced by drivers.json `picture` paths

scripts/
  reingest-bahrain.js   # one-off: re-ingests the existing Bahrain race files

transform.js            # ETL: AC Server Manager championship export → SKELETON data/*.json
                        # Race data (results/laps/incidents/conditions) comes from race-data ingestion
```

---

## 4. Data flow & storage model

There are **two parallel paths** to the data — don't mix them.

### Public-site path (read-only, build-time)

The public site loads JSON files via `require()` at module init in [lib/store/index.ts](lib/store/index.ts), builds Maps for fast lookup, and exposes accessors. [lib/data/index.ts](lib/data/index.ts) wraps these with React `cache()` and adds derived views (standings, profiles, records).

**Implication:** edits to `data/*.json` need a dev-server restart to take effect on public pages, because the JSON is bundled at module init.

### Admin path (read-write, request-time)

[lib/admin/data-io.ts](lib/admin/data-io.ts) reads/writes the same JSON files via `fs` on each request. It bypasses the bundled `require()`, so it always sees the current file contents.

**Why two paths:** the public site needs `require()` so it can be statically generated; the admin needs `fs` so writes are observed immediately and don't get cached.

```
                 ┌──────────────────────────────────┐
data/*.json ────►│ lib/store (require, build-time)  │──► public pages
                 └──────────────────────────────────┘
                 ┌──────────────────────────────────┐
data/*.json ◄───►│ lib/admin/data-io (fs, runtime)  │──► /api/admin/* + admin pages
                 └──────────────────────────────────┘
```

### Why JSON files (not a database)

The dataset is small (35 drivers, 26 tracks, ~14 rounds × 3 seasons) and single-edited. JSON keeps deployment trivial and lets you eyeball the data in git diffs. If the project grows, the migration target is a SQL DB behind the same `lib/data` interface.

---

## 5. Key data shapes

All schemas are in [lib/types/index.ts](lib/types/index.ts) — `import { ChampionshipSchema, type Championship } from "@/lib/types"`. Highlights:

- **Championship** — `{ id, season, year, name, classes[], rounds[], status, pointsTable? }`
- **Round** — `{ id, index, track, date, status, sessions[] }`
- **Session** — `{ id, type: "practice"|"qualifying"|"race", subLabel?, conditions, results[], laps[], incidents[], status, raceDataFile? }`
- **Result** — `{ pos, gridPos, driverId, teamId, classId, bestLap, gap, points, status: "finished"|"dnf"|"dsq"|"dnq" }`
- **Lap** — `{ driverId, lapNo, time: "M:SS.mmm", sectors: [s1, s2, s3] strings, compound, cut, weatherTag? }`
- **Driver** — `{ id, name, number, country, teamId, license, joined, picture? }`

**Lap time format quirk:** `Lap.time` and `Lap.sectors` are strings, not milliseconds. Times under a minute are stored as `"36.344"` (no leading `0:`). Use the helpers in [lib/derive/lapAnalysis.ts](lib/derive/lapAnalysis.ts) (`parseLapTime`, `formatLapTime`) — don't reinvent the parser.

**Class IDs in our data are normalized:** `"indycar"` (primary) and `"am"`. The raw AC files use UUIDs — the ingestor maps these.

---

## 6. Admin panel

Lives at `/admin`. Route group `(admin)` keeps it on its own layout (no Backdrop/orbs).

### Pages

| Route | What it manages |
|-------|-----------------|
| `/admin` | Dashboard |
| `/admin/drivers` | Driver CRUD (incl. photo path) |
| `/admin/teams` | Team CRUD |
| `/admin/tracks` | Track CRUD |
| `/admin/championships` | Championship list |
| `/admin/championships/[id]` | Championship metadata + rounds management (with inline date editing for upcoming rounds) |
| `/admin/championships/[id]/rounds/[roundId]` | Round detail — sessions + per-session expandable editor |

### Admin API (`app/api/admin/`)

REST endpoints, all validated against the Zod schemas in [lib/types](lib/types/index.ts). Standard CRUD shape: `GET /resource`, `POST /resource`, `GET|PUT|DELETE /resource/[id]`.

```
/api/admin/drivers[/:id]
/api/admin/teams[/:id]
/api/admin/tracks[/:id]
/api/admin/championships[/:id]
/api/admin/championships/:id/rounds[/:roundId]
/api/admin/championships/:id/rounds/:roundId/sessions[/:sessionId]
/api/admin/championships/:id/rounds/:roundId/sessions/:sessionId/ingest   # see §7
/api/admin/race-files[/:filename]                                          # see §7
```

In Next.js 16, dynamic-segment params are a Promise:

```ts
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Client-side data fetching

[lib/admin/use-api.ts](lib/admin/use-api.ts) provides `useQuery(url)` and `useMutation(url, method)` — minimal fetch wrappers with loading/error state. No SWR/React Query dependency.

---

## 7. Race-data ingestion (the AC pipeline)

The interesting bit. Each completed race has a raw export JSON from the AC Server Manager (e.g. `data/races/2026_4_12_16_24_RACE.json`). **Read [data/races/racedata.md](data/races/racedata.md)** for the complete format reference — every field, every gotcha. It's the most important doc in the repo if you're touching telemetry.

### Division of labor

`transform.js` and the race-data ingestor are intentionally split:

| Concern | Owner | Notes |
|---------|-------|-------|
| Championship metadata (id, name, season, year, status, classes) | `transform.js` | One-time / season setup |
| Driver registry (`drivers.json`) and team registry | `transform.js` | Maintains GUID → `dNN` mapping |
| Track metadata (`tracks.json`) | `transform.js` | Hardcoded table — single source for layout/turns/etc. |
| Round skeleton (id, index, date, track, **empty session shells**) | `transform.js` | Reads race-weekend files for round dates |
| Points table | `transform.js` (default) → editable in admin | Same shape across all seasons |
| Per-session **results** | Race-data ingestion | From `data/races/*.json` `Result[]` |
| Per-session **laps** | Race-data ingestion | From `data/races/*.json` `Laps[]` |
| Per-session **incidents** | Race-data ingestion | From `data/races/*.json` `Events[]`, with real lap numbers |
| Per-session **conditions** | Race-data ingestion | From the first lap's `Conditions` block |
| Per-session **points** | Race-data ingestion | Computed from results × championship's `pointsTable` |

`transform.js` writes EMPTY session shells. The race-data ingestor populates them. **Don't re-run `transform.js` on a championship that has already had race files ingested** — it will wipe them.

### Pipeline

```
data/races/<file>.json         # raw AC export, dropped here by an admin
        │
        ▼
lib/admin/ingestRaceData.ts    # ingestRaceFile() → { laps, results, incidents, conditions }
        │  uses data/driver-guids.json (Steam GUID → driverId)
        │  uses data/class-uuids.json  (AC class UUID → "indycar"/"am")
        │  uses championship.pointsTable to compute points
        ▼
data/cnsrc-sNN.json            # session gets fully populated
        │
        ▼
session detail page surfaces:  # results dropdown, consistency, position chart
  - components/session/results-with-laps.tsx
  - components/session/consistency-view.tsx
  - components/session/race-positions-chart.tsx
```

### Driving it via the admin UI

`/admin/championships/[id]/rounds/[roundId]` → expand a race session → "Datos de carrera" panel:

1. Pick or upload an AC race JSON
2. Click **Ingerir** — server runs `ingestRaceFile`, updates `data/cnsrc-sNN.json`, sets `session.raceDataFile`. Round/session statuses flip from `upcoming` → `done` automatically.
3. Banner shows `{N vueltas · N pilotos · N resultados · N incidentes}` plus any drivers from the file that weren't matched in `driver-guids.json`

Keep `data/driver-guids.json` and `data/class-uuids.json` updated as new drivers/classes appear. The ingestor silently skips unknown GUIDs/UUIDs (and the panel reports them so you know).

### Re-ingestion is safe

Click **Ingerir** on the same file again to overwrite. **Vaciar** clears all four sub-fields and unlinks the file. Edits to the championship's `pointsTable` only take effect the next time you re-ingest a session (the points are baked into `Result.points` at ingestion time).

### Points table

Every championship has a `pointsTable: { r1, r2, fastestLapR1, fastestLapR2 }`. Same shape for every season (S01 backfilled to match S02/S03). Edit it from the championship admin page — the editor is below the metadata block. After changing the table, re-ingest each session to apply the new values.

### Lap analysis (derived metrics)

[lib/derive/lapAnalysis.ts](lib/derive/lapAnalysis.ts) is the single source for lap math:

- `parseLapTime(s)` / `formatLapTime(ms)` / `formatGap(ms)`
- `parseDriverLaps(laps)` — parsed + valid-flagged rows
- `analyzeDriverLaps(driverId, laps)` — `{ fastestLapMs, averageValidLapMs, theoreticalBestMs, consistencyPct, spreadMs, bestSectorsMs, ... }`. Excludes cut laps.
- `computeRacePositions(results, laps)` — per-lap position series for every driver, used by the chart

Add new lap-derived metrics here, never inline in components. Components call the helpers and render — no math in JSX.

---

## 8. Session detail page (`/sessions/[id]`)

[app/sessions/[id]/page.tsx](app/sessions/[id]/page.tsx) is a server component that wraps a client tab container [components/session/session-views.tsx](components/session/session-views.tsx) with three tabs:

| Tab | Component | Needs lap data? |
|-----|-----------|----------------|
| Resultados   | `results-with-laps.tsx` | Optional — without laps it's just a results table; with laps each row expands to show lap-by-lap |
| Consistencia | `consistency-view.tsx`  | Yes — empty state otherwise |
| Posiciones   | `race-positions-chart.tsx` | Yes — empty state otherwise |

The server page passes pre-computed driver/team name maps to the client (so the client doesn't need to hit `getDriver()` 21× per render).

---

## 9. Design system (very brief)

CSS tokens in [app/globals.css](app/globals.css) under `:root` and bridged into Tailwind via `@theme inline`. Always use the tokens, never hex literals:

- Colors: `var(--accent-red)`, `--text-{primary|secondary|tertiary}`, `--bg-{page|surface|surface-p1}`, `--border-{hairline|accent}`, `--status-{success|warning|danger}`
- Fonts: `var(--font-display)` (Oswald, uppercase), `var(--font-body)` (Inter), `var(--font-mono)` (JetBrains Mono with `tnum`)
- Shapes: `.glass` (panel with `clip-cut-{sm|md|lg}` for the cut-corner look), `.chip`, `.label`, `.mono`, `.display`
- Backdrop: `<Backdrop orbs={...} silhouette={...} bracketCorners />` for hero pages
- All UI text is **Spanish** — match it (`Pilotos`, `Equipos`, `Guardar`, `Eliminar`, `Vueltas`).

Don't introduce a UI library. Compose from `Glass`, `DataTable`, `PodiumGroup`, `SectionHeading`, `Chip`, etc.

---

## 10. Adding a new championship season

1. Run [transform.js](transform.js) against the AC Server Manager export to get a SKELETON `data/cnsrc-sNN.json` (championship metadata, classes, default points table, rounds with empty sessions)
2. Add it to the `RAW_CHAMPIONSHIPS` array in [lib/store/index.ts](lib/store/index.ts):
   ```ts
   require("@/data/cnsrc-sNN.json"),
   ```
3. Restart dev — it shows up in `/`, `/championships`, `/admin/championships`
4. As races happen, drop the AC race export JSON into `data/races/` and ingest it via the admin panel (§7)
5. (Optional) Tweak the points table from the championship admin page if your season uses a non-default scoring system

For day-to-day round/session edits, prefer the admin UI over editing JSON by hand — it validates against schemas before writing.

---

## 11. Common tasks

| Task | Where to start |
|------|----------------|
| Add a new field to a driver/team/track | Update `*Schema` in [lib/types/index.ts](lib/types/index.ts), then update the form in [components/admin/](components/admin/), then surface on the public page if needed |
| Add a new race-derived metric (e.g. tyre-stint chart) | Add a pure function in [lib/derive/lapAnalysis.ts](lib/derive/lapAnalysis.ts), then a new tab in [components/session/session-views.tsx](components/session/session-views.tsx) |
| Surface incidents from the race file | Already parsed in `data/races/*.json` `Events[]` — write a converter in `lib/admin/ingestRaceData.ts` and populate `session.incidents` during ingestion (see racedata.md for the lap-number derivation trick) |
| Support a new ingested data type from `racedata.md` | Same: extend `ingestRaceLaps` (or add a sibling), update `SessionSchema` if you need new storage, render in a new `components/session/*` tab |
| Change the public-site colors / shapes | Edit tokens in [app/globals.css](app/globals.css). Don't override per-component. |

---

## 12. Conventions

- **Spanish UI**, English code identifiers and code comments. JSDoc in English.
- **No premature abstractions.** Three similar lines beats a "shared helper" with one caller.
- **No comments explaining the obvious.** Save them for non-obvious invariants.
- **Pure functions in `lib/derive/`.** No React, no fs, no fetch. Easy to test, easy to reuse server- or client-side.
- **`fs` only in `lib/admin/` and route handlers.** Never in `lib/store` (which uses `require`) and never in client components.
- **Validate at the boundary.** Every admin POST/PUT runs `Schema.safeParse(body)` and returns 400 with `error.issues` on failure.
- **Filename safety.** Anything from user input that becomes a path goes through [`sanitizeFilename`](lib/admin/raceFilesIo.ts) — no exceptions.

---

## 13. Things that will bite you

- **Restart dev after editing `data/*.json`** — the public site path bundles them at init.
- **`params` is a Promise** in Next.js 16 dynamic routes. Don't destructure it directly.
- **`Lap.time` is a string**, not a number. Sub-minute times are `"36.344"` (no leading zero), full laps are `"1:36.344"`. Always parse with `parseLapTime`.
- **`session.laps` is empty by default** for sessions that haven't been ingested. Components must handle the empty case (the existing tabs already do).
- **Two driver entries with the same `name` but different `id`s exist** (e.g. `d02` and `d16` are both "Ameg Sanchez"). Match by `id` from the GUID map, not by name.
- **`ContributedToFastestLap` in the AC race file is per-driver PB**, not the session FL. Compute the session FL yourself.
- **AC race files contain a spectator entry** (`Driver.Name === "TV"`, zero ClassID). The ingestor filters these — don't undo that filter.
- **The class ID in the championship JSON is normalized** to `"indycar"` / `"am"`; the AC files use UUIDs. The class mapping happens in `transform.js` and in the ingestion path.

---

## 14. Useful files to read in order

1. [data/races/racedata.md](data/races/racedata.md) — race-export schema, deeply commented
2. [lib/types/index.ts](lib/types/index.ts) — every data shape
3. [lib/store/index.ts](lib/store/index.ts) — how the public site loads data
4. [lib/data/index.ts](lib/data/index.ts) — how derived views are exposed
5. [lib/derive/standings.ts](lib/derive/standings.ts) and [lib/derive/lapAnalysis.ts](lib/derive/lapAnalysis.ts) — how the math works
6. [app/sessions/[id]/page.tsx](app/sessions/[id]/page.tsx) — most feature-dense public page
7. [app/(admin)/admin/championships/[id]/rounds/[roundId]/page.tsx](app/(admin)/admin/championships/[id]/rounds/[roundId]/page.tsx) — most feature-dense admin page
8. [transform.js](transform.js) — the legacy ETL; useful context for how data was first generated

If you're stuck, those eight files explain ~90% of the system.
