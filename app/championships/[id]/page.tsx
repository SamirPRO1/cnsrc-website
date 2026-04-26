import { notFound } from "next/navigation";
import { getChampionship, getStandings, listChampionships } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import { Chip } from "@/components/ui/chip";
import { PointsTableDisplay } from "@/components/ui/points-table";
import Link from "next/link";
import type { StandingsRow } from "@/lib/types";

export async function generateStaticParams() {
  return listChampionships().map((c) => ({ id: c.id }));
}

const STANDINGS_COLUMNS = [
  { key: "pos",      label: "POS",       width: 48,  mono: true, accentIfLeader: true },
  { key: "name",     label: "PILOTO",    align: "left" as const },
  { key: "teamName", label: "EQUIPO",    align: "left" as const },
  { key: "pts",      label: "PUNTOS",    width: 80,  mono: true, accentIfLeader: true, align: "right" as const },
  { key: "wins",     label: "VICTORIAS", width: 88,  mono: true, align: "right" as const },
  { key: "podiums",  label: "PODIOS",    width: 72,  mono: true, align: "right" as const },
  { key: "poles",    label: "POLES",     width: 64,  mono: true, align: "right" as const },
  { key: "dnfs",     label: "DNF",       width: 56,  mono: true, align: "right" as const },
] satisfies import("@/components/ui/data-table").Column<StandingsRow>[];

export default async function ChampionshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const champ = getChampionship(id);
  if (!champ) notFound();

  const classStandings = champ.classes.map((cls) => ({
    classId: cls.id,
    label: cls.label,
    rows: getStandings(id, cls.id),
  }));

  const doneRounds  = champ.rounds.filter((r) => r.status === "done").length;
  const trackIds    = [...new Set(champ.rounds.map((r) => r.track.id))].slice(0, 8);
  const isMultiClass = champ.classes.length > 1;
  const classRowBg  = isMultiClass
    ? (row: StandingsRow) => row.classId === "am" ? "rgba(34,197,94,0.09)" : "rgba(220,38,38,0.09)"
    : undefined;

  return (
    <Backdrop
      orbs={[
        { color: "red",    x: -100, y: -60, w: 400, h: 400, opacity: 0.8 },
        { color: "purple", x: 800,  y: 100, w: 400, h: 400, opacity: 0.6 },
      ]}
      silhouette={<CompoundSilhouettes tracks={trackIds} opacity={0.05} />}
      bracketCorners
    >
      <TopNav />

      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb items={[{ label: "CNSRC", href: "/" }, { label: "Campeonatos", href: "/championships" }, champ.season]} />

        {/* Hero */}
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16 }} data-primary-red>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Chip>{champ.season}</Chip>
                <Chip>{champ.year}</Chip>
                {champ.status === "live" && <Chip tone="live">EN VIVO</Chip>}
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                {champ.name}
              </h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, flexShrink: 0 }}>
              {[
                { label: "RONDAS",  value: champ.rounds.length },
                { label: "HECHAS",  value: doneRounds },
                { label: "CLASES",  value: champ.classes.length },
                { label: "ESTADO",  value: champ.status.toUpperCase(), accent: true },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span className="label">{s.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: s.accent ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Glass>

        {/* Standings + Points side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, alignItems: "start" }}>
          {/* Standings per class */}
          <div>
            {classStandings.map((cs) => cs.rows.length > 0 && (
              <div key={cs.classId} style={{ marginBottom: 16 }}>
                <SectionHeading eyebrow="CLASIFICACIÓN DEL CAMPEONATO" title={`Clase ${cs.label}`} />
                <Glass cut={18} pad={0}>
                  <DataTable columns={STANDINGS_COLUMNS} rows={cs.rows} leaderRowIndex={0} rowBg={classRowBg} />
                </Glass>
              </div>
            ))}
          </div>

          {/* Points system */}
          {champ.pointsTable && (
            <div>
              <SectionHeading eyebrow="REGLAMENTO" title="Sistema de puntos" />
              <Glass cut={18} pad={0}>
                <PointsTableDisplay table={champ.pointsTable} />
              </Glass>
            </div>
          )}
        </div>

        {/* Calendar */}
        <SectionHeading eyebrow="CALENDARIO" title="Calendario de rondas" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {champ.rounds.map((r) => {
            const raceSessions = r.sessions.filter((s) => s.type === "race");
            return (
              <Glass key={r.id} cut={14} pad={16}>
                <div style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 16, alignItems: "center" }}>
                  {r.status === "done" ? (
                    <Link href={`/rounds/${r.id}`} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", textDecoration: "none" }}>
                      {String(r.index).padStart(2, "0")}
                    </Link>
                  ) : (
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                      {String(r.index).padStart(2, "0")}
                    </span>
                  )}
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 16, color: "var(--text-primary)" }}>{r.track.name}</div>
                    <div style={{ display: "flex", gap: 14, marginTop: 3 }}>
                      <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.date}</span>
                      <span className="label" style={{ color: "var(--text-tertiary)" }}>{r.track.country} · {r.track.lengthKm} km · {r.track.turns} curvas</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {raceSessions.map((s) => (
                      s.results.length > 0 ? (
                        <Link key={s.id} href={`/sessions/${s.id}`} style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.18em", color: "var(--accent-red)", textDecoration: "none", padding: "4px 8px", border: "0.5px solid var(--border-accent)" }}>
                          {s.subLabel ?? s.type.toUpperCase()} →
                        </Link>
                      ) : (
                        <span key={s.id} className="chip">{s.subLabel ?? s.type.toUpperCase()}</span>
                      )
                    ))}
                    {r.status === "upcoming" && <Chip>PRÓXIMA</Chip>}
                  </div>
                </div>
              </Glass>
            );
          })}
        </div>
      </div>

      <CNSRCFooter />
    </Backdrop>
  );
}
