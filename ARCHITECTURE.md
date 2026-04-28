# CNSRC — Developer Architecture Map

**Campeonato Nacional Simracing Cuba** — A championship results portal + admin panel for an Assetto Corsa sim-racing league.

---

## What This App Does

| Audience | Area | Access |
|----------|------|--------|
| Public | Browse standings, driver profiles, session results, track records, lap data | Read-only, no auth |
| Admin | Create/edit championships, drivers, teams, tracks; upload & ingest AC race files | `/admin/*`, no auth guard yet |

Stack: **Next.js App Router · React 19 · Tailwind CSS 4 · Zod · Recharts · TanStack Table**

Data is persisted as **JSON files on disk** (`/data/`). There is no database.

---

## Site Structure

```
/                           Home — active championship hero, latest results, Discord widget
/championships/[id]         Championship detail — standings per class, round calendar, points table
/drivers                    Driver grid — all drivers with team + license
/drivers/[id]               Driver profile — career seasons, form strip, track bests
/tracks                     Track grid — all tracks with specs
/tracks/[id]                Track detail — session history + lap records by class
/sessions/[id]              Session detail — results, lap-by-lap, position chart, consistency view
/rounds/[id]                Round results
/records                    Global records — all-time stats, fastest lap per track

/admin                      Dashboard — summary stats, quick links
/admin/championships        Championship CRUD
/admin/championships/[id]/rounds/[roundId]
                            Round editor — add sessions, upload race files, edit incidents/results
/admin/drivers              Driver CRUD
/admin/teams                Team CRUD
/admin/tracks               Track CRUD
```

> All public pages are **Server Components** (SSR + static generation where possible).
> All `/admin/*` pages are **Client Components** that call REST API routes.

---

## Data Flow

```
┌───────────────────────────────────────────────┐
│  /data/  (JSON files on disk)                 │
│                                               │
│  drivers.json          ← drivers + teams      │
│  tracks.json           ← track definitions    │
│  cnsrc-s01.json        ← season 1 champ       │
│  cnsrc-s02.json        ← season 2 champ       │
│  cnsrc-s03.json        ← season 3 champ       │
│  races/*.json          ← raw AC race exports  │
│  class-uuids.json      ← AC class → classId   │
│  driver-guids.json     ← Steam GUID → driverId│
└────────────┬──────────────────────────────────┘
             │  loaded once on first request
             ▼
┌───────────────────────────────────────────────┐
│  lib/store/index.ts  (in-memory singleton)    │
│                                               │
│  Maps: championships, rounds, sessions,       │
│        drivers, teams, tracks                 │
│  Rebuilt on cold start; mutated by admin      │
│  API writes → next request sees new state     │
└────────┬──────────────────────┬───────────────┘
         │ Server Components    │ Admin API Routes
         ▼                      ▼
┌──────────────────┐  ┌─────────────────────────┐
│ lib/data/        │  │ app/api/admin/**        │
│ index.ts         │  │                         │
│                  │  │ Each route:             │
│ React.cache()    │  │  1. Read/parse body     │
│ wrapped access   │  │  2. Validate with Zod   │
│ functions —      │  │  3. Call data-io.ts     │
│ memoized per     │  │  4. Write JSON file     │
│ request          │  │  5. Return JSON resp    │
└────────┬─────────┘  └───────────┬─────────────┘
         │                        │ fetch() from client
         ▼                        ▼
┌──────────────────┐  ┌─────────────────────────┐
│ Server Pages     │  │ Admin Client Components  │
│ (SSR/SSG)        │  │                         │
│                  │  │ lib/admin/use-api.ts:   │
│ Compute derived  │  │  useQuery()  → GET      │
│ views on-the-fly │  │  useMutation() → POST   │
│ (standings,      │  │               PUT/DELETE│
│  records, etc.)  │  │                         │
└────────┬─────────┘  └───────────┬─────────────┘
         │                        │
         └──────────┬─────────────┘
                    ▼
              React Components
              rendered to HTML
```

---

## Race File Ingestion Flow

When an admin uploads an Assetto Corsa race JSON file:

```
Admin uploads .json file
        │
        ▼
POST /api/admin/race-files          ← saves raw file to data/races/
        │
        ▼
POST /api/admin/.../sessions/[id]/ingest
        │
        ▼
lib/admin/ingestRaceData.ts
  ├── parse laps + results from AC format
  ├── map driver GUIDs → driverId      (data/driver-guids.json)
  ├── map AC class UUIDs → classId     (data/class-uuids.json)
  ├── compute points from championship pointsTable
  ├── extract incidents (collision events)
  └── return structured Session object
        │
        ▼
Merged into Round → written to data/cnsrc-sXX.json
```

---

## Key Files & Their Roles

| File | Role |
|------|------|
| `lib/types/index.ts` | **Single source of truth** — all Zod schemas + TS types |
| `lib/store/index.ts` | In-memory singleton; builds Maps from JSON files |
| `lib/data/index.ts` | Server-side data access layer; `React.cache()` wrappers |
| `lib/derive/standings.ts` | Compute `StandingsRow[]` from raw session results |
| `lib/derive/trackRecords.ts` | Extract fastest laps per track+class across all sessions |
| `lib/derive/lapAnalysis.ts` | Per-driver lap stats (consistency, best sectors, etc.) |
| `lib/admin/data-io.ts` | All `fs` reads/writes — single place for disk I/O |
| `lib/admin/ingestRaceData.ts` | AC race JSON → structured `Session` |
| `lib/admin/raceFilesIo.ts` | List/read/write raw race file blobs |
| `lib/admin/use-api.ts` | `useQuery` + `useMutation` hooks for admin client components |
| `app/api/admin/**/route.ts` | REST endpoints — validate → call data-io → respond |
| `app/page.tsx` | Home page; also fetches Discord widget (60s revalidate) |
| `app/layout.tsx` | Root layout: fonts (Inter, Oswald, JetBrains Mono), metadata |
| `app/globals.css` | Design tokens, layout utilities, animation keyframes |

---

## Data Model (Core Types)

```
Championship
  ├── id, season, year, name, status
  ├── classes: ClassDef[]        { id, label, car }
  ├── pointsTable: PointsTable   { r1[], r2[], fastestLapR1, fastestLapR2 }
  └── rounds: Round[]
        ├── id, index, date, status, youtubeUrl
        ├── track: TrackRef      { id, name, short, country, lengthKm, turns }
        └── sessions: Session[]
              ├── id, type ("Race1"|"Race2"|"Qualifying"), status
              ├── conditions: Conditions  { airTemp, trackTemp, weather, windKph }
              ├── results: Result[]       { pos, gridPos, driverId, teamId, classId,
              │                            bestLap, gap, points, status }
              ├── laps: Lap[]             { driverId, lapNo, time, sectors,
              │                            compound, cut, weatherTag }
              └── incidents: Incident[]   { lap, kind, driverIds, summary }

Driver
  ├── id, name, number, country, license, joined, picture
  ├── teamId → Team { id, name, colors }
  └── guids: string[]   (Steam GUIDs for AC GUID mapping)

TrackRef
  └── id, name, short, country, layout, lengthKm, turns
```

**Derived views** (computed at request time, never stored):

| Type | Computed by | Used in |
|------|-------------|---------|
| `StandingsRow` | `lib/derive/standings.ts` | `/championships/[id]` |
| `TrackRecord` | `lib/derive/trackRecords.ts` | `/tracks/[id]`, `/records` |
| `DriverProfile` | `lib/data/index.ts` | `/drivers/[id]` |
| `TrackDetail` | `lib/data/index.ts` | `/tracks/[id]` |
| `GlobalRecords` | `lib/data/index.ts` | `/records` |

---

## Component Map

### Public UI (`components/ui/`)

| Component | What it renders |
|-----------|----------------|
| `top-nav.tsx` | Main nav bar with logo + links |
| `footer.tsx` | Site footer |
| `backdrop.tsx` | Animated blur orb background |
| `glass.tsx` | Glassmorphic card with CSS cut corners |
| `podium.tsx` | P1/P2/P3 winner display with driver pictures |
| `data-table.tsx` | Sortable table (TanStack Table) |
| `points-table.tsx` | Points scoring grid per position |
| `chip.tsx` | Status/tag pills; `LiveChip` variant |
| `breadcrumb.tsx` | Navigation breadcrumb |
| `section-heading.tsx` | Section title + optional right slot |
| `track-silhouette.tsx` | SVG track outlines |
| `youtube-banner.tsx` | Embedded YouTube preview |

### Session Detail (`components/session/`)

| Component | What it renders |
|-----------|----------------|
| `session-views.tsx` | Tab switcher for the 3 views below |
| `results-with-laps.tsx` | Results table + expandable lap rows per driver |
| `race-positions-chart.tsx` | Animated position-over-laps line chart (Recharts) |
| `consistency-view.tsx` | Lap time distribution + consistency stats (Recharts) |

### Admin (`components/admin/`)

| Component | Purpose |
|-----------|---------|
| `admin-sidebar.tsx` | Left nav for admin area |
| `admin-data-table.tsx` | Generic table with edit/delete row actions |
| `admin-form-field.tsx` | Styled input/select wrapper |
| `admin-dialog.tsx` | Confirmation modal |
| `admin-button.tsx` | Styled admin action button |
| `driver-form.tsx` | Create/edit driver |
| `team-form.tsx` | Create/edit team |
| `race-data-panel.tsx` | Upload race file + trigger ingestion |
| `results-editor.tsx` | Inline table editor for session results |
| `incidents-editor.tsx` | Add/edit collision incidents |
| `points-table-editor.tsx` | Edit championship scoring values |

---

## Static Generation

Pages that call `generateStaticParams()` and are pre-rendered at build time:

- `/championships/[id]` — all championship IDs
- `/drivers/[id]` — all driver IDs
- `/sessions/[id]` — all session IDs across all championships

---

## External Integrations

| Service | Where | How |
|---------|-------|-----|
| Discord Widget | `app/page.tsx` | `fetch()` with `revalidate: 60`; shows online members, voice channels |
| Assetto Corsa | Race JSON uploads | Parsed by `ingestRaceData.ts`; not a live connection |

---

## Architecture Decisions to Know

1. **No database** — everything is JSON files in `/data/`. Works fine for single-instance Node.js; would break on serverless or multi-instance.
2. **No auth** — admin routes are unprotected. Intended for internal/local use or behind a reverse proxy.
3. **Derived views are computed on the fly** — standings, records, and profiles are never cached to disk; they're recalculated each request (protected from redundant work by `React.cache()`).
4. **In-memory store is a singleton** — mutating admin writes update the disk file; the next read re-derives from disk. There's no invalidation mechanism between server instances.
5. **All Zod schemas live in one file** (`lib/types/index.ts`) — change data shapes there first, then update consumers.
6. **Two-track rendering** — public pages are Server Components (minimal client JS); admin pages are Client Components (interactive forms, real-time feedback).
