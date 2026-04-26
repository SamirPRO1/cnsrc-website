import { getGlobalRecords, listChampionships } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import type { TrackRecord } from "@/lib/types";

const TRACK_RECORD_COLS = [
  { key: "trackId",    label: "CIRCUITO", render: (r: TrackRecord) => r.trackId.toUpperCase() },
  { key: "classId",   label: "CLASE",    render: (r: TrackRecord) => <span className="chip">{r.classId.toUpperCase()}</span> },
  { key: "time",      label: "TIEMPO",   mono: true, accentIfLeader: true },
  { key: "driverName",label: "PILOTO" },
  { key: "teamName",  label: "EQUIPO" },
  { key: "date",      label: "FECHA",    mono: true },
] satisfies import("@/components/ui/data-table").Column<TrackRecord>[];

export default function GlobalRecordsPage() {
  const records = getGlobalRecords();
  const champs  = listChampionships();
  const allTracks = [...new Set(champs.flatMap((c) => c.rounds.map((r) => r.track.id)))];

  return (
    <Backdrop
      orbs={[
        { color: "red",    x: -80, y: -60,  w: 380, h: 380, opacity: 0.7 },
        { color: "purple", x: 800, y: 100,  w: 360, h: 360, opacity: 0.6 },
        { color: "amber",  x: 400, y: 600,  w: 260, h: 260, opacity: 0.3 },
      ]}
      silhouette={<CompoundSilhouettes tracks={allTracks.slice(0,8)} opacity={0.05} />}
      bracketCorners
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>

        {/* Hero stat row */}
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 20 }} data-primary-red>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                Salón de Récords
              </h1>
              <div style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 6 }}>
                Estadísticas históricas del campeonato CNSRC
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, flexShrink: 0 }}>
              {[
                { label: "CARRERAS",  value: String(records.totalRaces) },
                { label: "VUELTAS",   value: String(records.totalLaps) },
                { label: "PILOTOS",   value: String(records.totalDrivers) },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="label">{s.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Glass>

        {/* All-time leaders */}
        {records.allTimeLeaders.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="HISTÓRICO" title="Líderes" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 8 }}>
              {records.allTimeLeaders.map((l, i) => (
                <Glass key={i} cut={14} pad={16} stripe={i===0} data-primary-red={i===0}>
                  <div className="label" style={{ marginBottom: 6 }}>{l.stat}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: i===0 ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{l.value}</div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 5 }}>{l.driverName}</div>
                </Glass>
              ))}
            </div>
          </div>
        )}

        {/* Fastest lap by track */}
        {records.fastestByTrack.length > 0 && (
          <div>
            <SectionHeading eyebrow="RÉCORDS DE VUELTA" title="Vuelta rápida por circuito" />
            <Glass cut={18} pad={0}>
              <DataTable columns={TRACK_RECORD_COLS} rows={records.fastestByTrack} leaderRowIndex={0} />
            </Glass>
          </div>
        )}
      </div>
      <CNSRCFooter />
    </Backdrop>
  );
}
