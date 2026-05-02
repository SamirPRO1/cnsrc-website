import { getGlobalRecords, listChampionships } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import type { StatLeader } from "@/lib/types";

function StatCard({ stat, am }: { stat: StatLeader; am?: boolean }) {
  const accent = am ? "var(--status-warning)" : "var(--accent-red)";
  return (
    <Glass cut={14} pad={16} style={{ border: am ? "0.5px solid rgba(234,179,8,0.25)" : undefined }}>
      <div className="label" style={{ fontSize: 10, color: am ? "var(--status-warning)" : "var(--text-tertiary)", marginBottom: 2, letterSpacing: "0.18em" }}>
        {stat.eyebrow}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "var(--text-secondary)", marginBottom: 12 }}>
        {stat.label}
      </div>
      {stat.top.length === 0 ? (
        <span className="label" style={{ color: "var(--text-tertiary)" }}>—</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {stat.top.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 11, color: i === 0 ? accent : "var(--text-tertiary)", width: 16, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: i === 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.driverName}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? accent : "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                {e.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Glass>
  );
}

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
      silhouette={<CompoundSilhouettes tracks={allTracks.slice(0, 8)} opacity={0.05} />}
      bracketCorners
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>

        {/* Hero */}
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 24 }} data-primary-red>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                Salón de Récords
              </h1>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
                Estadísticas históricas del campeonato CNSRC · Clase PRO
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, flexShrink: 0 }}>
              {[
                { label: "CARRERAS",      value: String(records.totalRaces) },
                { label: "VUELTAS",       value: String(records.totalLaps) },
                { label: "PILOTOS",       value: String(records.totalDrivers) },
                { label: "TEMPORADAS",    value: String(records.totalChampionships) },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="label">{s.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Glass>

        {/* PRO stats */}
        <SectionHeading eyebrow="CLASE PRO" title="Estadísticas históricas" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 32 }}>
          {records.proStats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* AM stats — visually distinct */}
        <div style={{ borderTop: "0.5px solid rgba(234,179,8,0.3)", paddingTop: 24 }}>
          <SectionHeading
            eyebrow="CLASE AM · TEMPORADA S02"
            title="Estadísticas AM"
            right={
              <span style={{ fontFamily: "var(--font-display)", fontSize: 10, letterSpacing: "0.2em", color: "var(--status-warning)", border: "0.5px solid var(--status-warning)", padding: "3px 8px" }}>
                CLASE SECUNDARIA · NO EQUIVALENTE A PRO
              </span>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {records.amStats.map((stat) => (
              <StatCard key={stat.label} stat={stat} am />
            ))}
          </div>
        </div>

      </div>
      <CNSRCFooter />
    </Backdrop>
  );
}
