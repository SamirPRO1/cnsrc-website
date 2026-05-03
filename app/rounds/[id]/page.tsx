import { notFound } from "next/navigation";
import Link from "next/link";
import { getRound, listChampionships, getDriver, getTeam } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CNSRCFooter } from "@/components/ui/footer";
import { TrackSilhouette } from "@/components/ui/track-silhouette";
import { Chip } from "@/components/ui/chip";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { TextScramble } from "@/components/ui/effects/TextScramble";
import type { Session } from "@/lib/types";

export async function generateStaticParams() {
  const ids: { id: string }[] = [];
  for (const c of listChampionships()) for (const r of c.rounds) ids.push({ id: r.id });
  return ids;
}

type QualiRow = {
  pos: number;
  name: string;
  teamName: string;
  classId: string;
  bestLap: string;
  gap: string;
};

type ResultRow = {
  pos: number;
  grid: number;
  name: string;
  teamName: string;
  classId: string;
  bestLap: string;
  gap: string;
  pts: number;
  statusLabel: string;
};

type TotalRow = {
  pos: number;
  name: string;
  teamName: string;
  classId: string;
  r1: string;
  r2: string;
  total: number;
};

const SESSION_LINK_STYLE = {
  fontFamily: "var(--font-display)",
  fontSize: 11,
  letterSpacing: "0.18em",
  color: "var(--accent-red)",
  textDecoration: "none",
  padding: "4px 8px",
  border: "0.5px solid var(--border-accent)",
} as const;

export default async function RoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = getRound(id);
  if (!round) notFound();

  const champs = listChampionships();
  let ownerChamp = null;
  for (const c of champs) {
    if (c.rounds.some((r) => r.id === id)) { ownerChamp = c; break; }
  }

  const qualiSession = round.sessions.find((s) => s.type === "qualifying") as Session | undefined;
  const raceSessions = round.sessions.filter((s) => s.type === "race");
  const r1 = raceSessions[0] as Session | undefined;
  const r2 = raceSessions[1] as Session | undefined;
  const isMultiClass = (ownerChamp?.classes.length ?? 0) > 1;

  function buildQualiRows(session: Session | undefined): QualiRow[] {
    if (!session || session.results.length === 0) return [];
    return session.results.map((r) => ({
      pos: r.pos,
      name: getDriver(r.driverId)?.name ?? r.driverId,
      teamName: getTeam(r.teamId)?.name ?? r.teamId,
      classId: r.classId,
      bestLap: r.bestLap,
      gap: r.gap,
    }));
  }

  function buildResultRows(session: Session | undefined): ResultRow[] {
    if (!session) return [];
    return session.results.map((r) => ({
      pos: r.pos,
      grid: r.gridPos,
      name: getDriver(r.driverId)?.name ?? r.driverId,
      teamName: getTeam(r.teamId)?.name ?? r.teamId,
      classId: r.classId,
      bestLap: r.bestLap,
      gap: r.gap,
      pts: r.points,
      statusLabel: r.status,
    }));
  }

  // Merge R1 + R2 points per driver
  const totals = new Map<string, { name: string; teamName: string; classId: string; r1Pts: number; r2Pts: number }>();
  for (const res of r1?.results ?? []) {
    totals.set(res.driverId, {
      name: getDriver(res.driverId)?.name ?? res.driverId,
      teamName: getTeam(res.teamId)?.name ?? res.teamId,
      classId: res.classId,
      r1Pts: res.points,
      r2Pts: 0,
    });
  }
  for (const res of r2?.results ?? []) {
    const existing = totals.get(res.driverId);
    if (existing) {
      existing.r2Pts = res.points;
    } else {
      totals.set(res.driverId, {
        name: getDriver(res.driverId)?.name ?? res.driverId,
        teamName: getTeam(res.teamId)?.name ?? res.teamId,
        classId: res.classId,
        r1Pts: 0,
        r2Pts: res.points,
      });
    }
  }

  const totalRows: TotalRow[] = [...totals.values()]
    .sort((a, b) => (b.r1Pts + b.r2Pts) - (a.r1Pts + a.r2Pts))
    .map((v, i) => ({
      pos: i + 1,
      name: v.name,
      teamName: v.teamName,
      classId: v.classId,
      r1: v.r1Pts > 0 ? String(v.r1Pts) : "—",
      r2: v.r2Pts > 0 ? String(v.r2Pts) : "—",
      total: v.r1Pts + v.r2Pts,
    }));

  const qualiCols: Column<QualiRow>[] = [
    { key: "pos",      label: "POS",       width: 40,  mono: true, accentIfLeader: true },
    ...(isMultiClass ? [{ key: "classId" as keyof QualiRow, label: "CLASE", width: 56 }] : []),
    { key: "name",     label: "PILOTO",    align: "left" },
    { key: "teamName", label: "EQUIPO",    align: "left" },
    { key: "bestLap",  label: "MEJOR VTA", width: 96,  mono: true, align: "right" },
    { key: "gap",      label: "GAP",       width: 76,  mono: true, align: "right" },
  ];

  const resultCols: Column<ResultRow>[] = [
    { key: "pos",        label: "POS",       width: 40,  mono: true, accentIfLeader: true },
    ...(isMultiClass ? [{ key: "classId" as keyof ResultRow, label: "CLASE", width: 56 }] : []),
    { key: "name",       label: "PILOTO",    align: "left" },
    { key: "bestLap",    label: "MEJOR VTA", width: 88,  mono: true, align: "right" },
    { key: "gap",        label: "GAP",       width: 76,  mono: true, align: "right" },
    { key: "pts",        label: "PTS",       width: 50,  mono: true, align: "right", accentIfLeader: true },
    {
      key: "statusLabel",
      label: "",
      width: 52,
      align: "right",
      render: (row: ResultRow) => (
        <span style={{
          color: row.statusLabel === "finished" ? "var(--text-secondary)" : "var(--accent-red)",
          fontSize: 11,
          fontFamily: "var(--font-display)",
          letterSpacing: "0.12em",
        }}>
          {row.statusLabel === "finished" ? "—" : row.statusLabel.toUpperCase()}
        </span>
      ),
    },
  ];

  const totalCols: Column<TotalRow>[] = [
    { key: "pos",   label: "POS",   width: 40,  mono: true, accentIfLeader: true },
    ...(isMultiClass ? [{ key: "classId" as keyof TotalRow, label: "CLASE", width: 56 }] : []),
    { key: "name",  label: "PILOTO", align: "left" },
    { key: "r1",    label: "R1",    width: 56,  mono: true, align: "right" },
    { key: "r2",    label: "R2",    width: 56,  mono: true, align: "right" },
    { key: "total", label: "TOTAL", width: 72,  mono: true, align: "right", accentIfLeader: true },
  ];

  const qualiRows = buildQualiRows(qualiSession);
  const r1Rows = buildResultRows(r1);
  const r2Rows = buildResultRows(r2);

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -80,  y: -60, w: 360, h: 360, opacity: 0.7, depth: 0.7 },
        { color: "purple", x: 700,  y: 200, w: 300, h: 300, opacity: 0.5, depth: 0.4 },
      ]}
      silhouette={<TrackSilhouette track={round.track.id} opacity={0.07} />}
    >
      <TopNav />

      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb
          items={[
            { label: "CNSRC", href: "/" },
            { label: ownerChamp?.season ?? "—", href: ownerChamp ? `/championships/${ownerChamp.id}` : undefined },
            { label: round.track.short, href: `/tracks/${round.track.id}` },
            `Ronda ${String(round.index).padStart(2, "0")}`,
          ]}
        />

        {/* Header */}
        <Reveal variant="clip">
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16, position: "relative", overflow: "hidden" }} data-primary-red className="fx-shine fx-shine--auto fx-glow-red">
          <div aria-hidden="true" style={{ position: "absolute", right: -40, top: -20, width: 320, height: 220, opacity: 0.6, pointerEvents: "none" }}>
            <TrackSilhouette track={round.track.id} opacity={0.18} strokeWidth={2} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, position: "relative" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Chip>{ownerChamp?.season ?? "—"}</Chip>
                <Chip>Ronda {String(round.index).padStart(2, "0")}</Chip>
                {round.status === "live" && <Chip tone="live">EN VIVO</Chip>}
              </div>
              <h1 className="fx-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                <TextScramble text={round.track.name} duration={900} />
              </h1>
              <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{round.date}</span>
                <span className="label" style={{ color: "var(--text-tertiary)" }}>
                  {round.track.country} · {round.track.lengthKm} km · {round.track.turns} curvas
                </span>
              </div>
            </div>
            {round.youtubeUrl && (
              <a href={round.youtubeUrl} target="_blank" rel="noopener noreferrer" style={SESSION_LINK_STYLE} className="fx-link-underline">
                VER EN YOUTUBE →
              </a>
            )}
          </div>
        </Glass>
        </Reveal>

        {/* Qualifying */}
        {qualiRows.length > 0 && (
          <Reveal variant="slide-l" style={{ marginBottom: 24 }}>
            <SectionHeading
              eyebrow="CLASIFICACIÓN"
              title="Resultados de Qualy"
              right={qualiSession && <Link href={`/sessions/${qualiSession.id}`} className="fx-link-underline" style={SESSION_LINK_STYLE}>VER SESIÓN →</Link>}
            />
            <Glass cut={18} pad={0}>
              <DataTable
                columns={qualiCols}
                rows={qualiRows}
                leaderRowIndex={0}
                rowBg={isMultiClass ? (row) => row.classId === "am" ? "rgba(34,197,94,0.09)" : "rgba(220,38,38,0.09)" : undefined}
              />
            </Glass>
          </Reveal>
        )}

        {/* R1 + R2 side by side */}
        {(r1Rows.length > 0 || r2Rows.length > 0) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: r1Rows.length > 0 && r2Rows.length > 0 ? "1fr 1fr" : "1fr",
            gap: 16,
            marginBottom: 24,
          }}>
            {r1Rows.length > 0 && (
              <Reveal variant="slide-l">
                <SectionHeading
                  eyebrow="CARRERA 1"
                  title={r1?.subLabel ?? "R1"}
                  right={r1 && <Link href={`/sessions/${r1.id}`} className="fx-link-underline" style={SESSION_LINK_STYLE}>VER SESIÓN →</Link>}
                />
                <Glass cut={18} pad={0}>
                  <DataTable
                    columns={resultCols}
                    rows={r1Rows}
                    leaderRowIndex={0}
                    rowBg={isMultiClass ? (row) => row.classId === "am" ? "rgba(34,197,94,0.09)" : "rgba(220,38,38,0.09)" : undefined}
                  />
                </Glass>
              </Reveal>
            )}
            {r2Rows.length > 0 && (
              <Reveal variant="slide-r">
                <SectionHeading
                  eyebrow="CARRERA 2"
                  title={r2?.subLabel ?? "R2"}
                  right={r2 && <Link href={`/sessions/${r2.id}`} className="fx-link-underline" style={SESSION_LINK_STYLE}>VER SESIÓN →</Link>}
                />
                <Glass cut={18} pad={0}>
                  <DataTable
                    columns={resultCols}
                    rows={r2Rows}
                    leaderRowIndex={0}
                    rowBg={isMultiClass ? (row) => row.classId === "am" ? "rgba(34,197,94,0.09)" : "rgba(220,38,38,0.09)" : undefined}
                  />
                </Glass>
              </Reveal>
            )}
          </div>
        )}

        {/* Combined round totals */}
        {totalRows.length > 0 && (
          <Reveal variant="up" style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="RESUMEN DE RONDA" title="Puntos totales" />
            <Glass cut={18} pad={0}>
              <DataTable
                columns={totalCols}
                rows={totalRows}
                leaderRowIndex={0}
                rowBg={isMultiClass ? (row) => row.classId === "am" ? "rgba(34,197,94,0.09)" : "rgba(220,38,38,0.09)" : undefined}
              />
            </Glass>
          </Reveal>
        )}
      </div>

      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
