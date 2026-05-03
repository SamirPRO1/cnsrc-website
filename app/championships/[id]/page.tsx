import { notFound } from "next/navigation";
import { getChampionship, getStandings, getTeamStandings, listChampionships } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import { Chip } from "@/components/ui/chip";
import { PointsTableDisplay } from "@/components/ui/points-table";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { AnimatedNumber } from "@/components/ui/effects/AnimatedNumber";
import { TextScramble } from "@/components/ui/effects/TextScramble";
import Link from "next/link";
import type { StandingsRow, TeamStandingsRow } from "@/lib/types";

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

const TEAM_STANDINGS_COLUMNS = [
  { key: "pos",      label: "POS",       width: 48,  mono: true, accentIfLeader: true },
  { key: "teamName", label: "EQUIPO",    align: "left" as const },
  { key: "pts",      label: "PUNTOS",    width: 80,  mono: true, accentIfLeader: true, align: "right" as const },
  { key: "wins",     label: "VICTORIAS", width: 88,  mono: true, align: "right" as const },
  { key: "podiums",  label: "PODIOS",    width: 72,  mono: true, align: "right" as const },
  { key: "drivers",  label: "PILOTOS",   width: 72,  mono: true, align: "right" as const },
] satisfies import("@/components/ui/data-table").Column<TeamStandingsRow>[];

export default async function ChampionshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const champ = getChampionship(id);
  if (!champ) notFound();

  const classStandings = champ.classes.map((cls) => ({
    classId: cls.id,
    label: cls.label,
    rows: getStandings(id, cls.id),
  }));

  const teamStandings = champ.teamPoints
    ? champ.classes.map((cls) => ({
        classId: cls.id,
        label: cls.label,
        rows: getTeamStandings(id, cls.id),
      }))
    : [];

  const doneRounds  = champ.rounds.filter((r) => r.status === "done").length;
  const trackIds    = [...new Set(champ.rounds.map((r) => r.track.id))].slice(0, 8);
  const isMultiClass = champ.classes.length > 1;
  const classRowBg  = isMultiClass
    ? (row: StandingsRow) => row.classId === "am" ? "rgba(34,197,94,0.09)" : "rgba(220,38,38,0.09)"
    : undefined;

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -100, y: -60, w: 400, h: 400, opacity: 0.8, depth: 0.7 },
        { color: "purple", x: 800,  y: 100, w: 400, h: 400, opacity: 0.6, depth: 0.4 },
      ]}
      silhouette={<CompoundSilhouettes tracks={trackIds} opacity={0.05} />}
      bracketCorners
    >
      <TopNav />

      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb items={[{ label: "CNSRC", href: "/" }, { label: "Campeonatos", href: "/championships" }, champ.season]} />

        {/* Hero */}
        <Reveal variant="clip">
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16 }} data-primary-red className="fx-shine fx-shine--auto fx-glow-red">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Chip>{champ.season}</Chip>
                <Chip>{champ.year}</Chip>
                {champ.status === "live" && <Chip tone="live">EN VIVO</Chip>}
              </div>
              <h1 className="fx-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                <TextScramble text={champ.name} duration={900} />
              </h1>
            </div>
            <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, flexShrink: 0 }}>
              {[
                { label: "RONDAS",  num: champ.rounds.length },
                { label: "HECHAS",  num: doneRounds },
                { label: "CLASES",  num: champ.classes.length },
                { label: "ESTADO",  text: champ.status.toUpperCase(), accent: true },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span className="label">{s.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: s.accent ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                    {"text" in s ? s.text : <AnimatedNumber value={s.num!} />}
                  </span>
                </div>
              ))}
            </Stagger>
          </div>
        </Glass>
        </Reveal>

        {/* Standings + Points side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, alignItems: "start" }}>
          {/* Standings per class */}
          <Reveal variant="slide-l">
            {classStandings.map((cs) => cs.rows.length > 0 && (
              <div key={cs.classId} style={{ marginBottom: 16 }}>
                <SectionHeading eyebrow="CLASIFICACIÓN DEL CAMPEONATO" title={`Clase ${cs.label}`} />
                <Glass cut={18} pad={0}>
                  <DataTable columns={STANDINGS_COLUMNS} rows={cs.rows} leaderRowIndex={0} rowBg={classRowBg} />
                </Glass>
              </div>
            ))}
          </Reveal>

          {/* Points system */}
          {champ.pointsTable && (
            <Reveal variant="slide-r">
              <SectionHeading eyebrow="REGLAMENTO" title="Sistema de puntos" />
              <Glass cut={18} pad={0}>
                <PointsTableDisplay table={champ.pointsTable} />
              </Glass>
            </Reveal>
          )}
        </div>

        {/* Team standings */}
        {teamStandings.length > 0 && (
          <Reveal variant="slide-l">
            <div style={{ marginBottom: 24 }}>
              {teamStandings.map((ts) => ts.rows.length > 0 && (
                <div key={ts.classId} style={{ marginBottom: 16 }}>
                  <SectionHeading eyebrow="CLASIFICACIÓN POR EQUIPOS" title={`Clase ${ts.label}`} />
                  <Glass cut={18} pad={0}>
                    <DataTable columns={TEAM_STANDINGS_COLUMNS} rows={ts.rows} leaderRowIndex={0} />
                  </Glass>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Calendar */}
        <Reveal variant="up">
          <SectionHeading eyebrow="CALENDARIO" title="Calendario de rondas" />
        </Reveal>
        <Stagger style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {champ.rounds.map((r) => {
            const raceSessions = r.sessions.filter((s) => s.type === "race");
            const isDone = r.status === "done";
            const isLive = r.status === "live";
            const card = (
              <Glass key={r.id} cut={14} pad={16} style={{ cursor: isDone ? "pointer" : "default" }} className={isLive ? "fx-glow-red" : ""}>
                <div style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 16, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: isDone ? "var(--text-primary)" : "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                    {String(r.index).padStart(2, "0")}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 16, color: "var(--text-primary)" }}>{r.track.name}</div>
                    <div style={{ display: "flex", gap: 14, marginTop: 3 }}>
                      <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.date}</span>
                      <span className="label" style={{ color: "var(--text-tertiary)" }}>{r.track.country} · {r.track.lengthKm} km · {r.track.turns} curvas</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {raceSessions.map((s) => (
                      <span key={s.id} className="chip">{s.subLabel ?? s.type.toUpperCase()}</span>
                    ))}
                    {r.status === "upcoming" && <Chip>PRÓXIMA</Chip>}
                    {isLive && <Chip tone="live">EN VIVO</Chip>}
                  </div>
                </div>
              </Glass>
            );
            return isDone ? (
              <Link key={r.id} href={`/rounds/${r.id}`} style={{ textDecoration: "none" }} className="fx-lift">
                {card}
              </Link>
            ) : card;
          })}
        </Stagger>
      </div>

      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
