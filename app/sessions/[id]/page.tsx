import { notFound } from "next/navigation";
import { getSession, listChampionships, getDriver, getTeam } from "@/lib/data";
import { PointsTableDisplay } from "@/components/ui/points-table";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { PodiumGroup } from "@/components/ui/podium";
import { CNSRCFooter } from "@/components/ui/footer";
import { YouTubeBanner } from "@/components/ui/youtube-banner";
import { TrackSilhouette } from "@/components/ui/track-silhouette";
import { Chip } from "@/components/ui/chip";
import SessionViews from "@/components/session/session-views";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { TextScramble } from "@/components/ui/effects/TextScramble";


export async function generateStaticParams() {
  const champs = listChampionships();
  const ids: { id: string }[] = [];
  for (const c of champs) for (const r of c.rounds) for (const s of r.sessions) ids.push({ id: s.id });
  return ids;
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) notFound();

  // find the round / championship that owns this session
  const champs = listChampionships();
  let ownerRound = null, ownerChamp = null;
  outer: for (const c of champs) {
    for (const r of c.rounds) {
      if (r.sessions.some((s) => s.id === id)) {
        ownerRound = r;
        ownerChamp = c;
        break outer;
      }
    }
  }

  const podiumRaw   = session.results.filter((r) => r.pos <= 3).sort((a, b) => a.pos - b.pos);
  const hasPodium   = podiumRaw.length === 3 && session.type === "race";
  const isMultiClass = (ownerChamp?.classes.length ?? 0) > 1;

  // Build name/picture/team lookup maps for the client view component
  const driverNames: Record<string, string> = {};
  const driverPictures: Record<string, string | undefined> = {};
  const teamNames: Record<string, string> = {};
  for (const r of session.results) {
    const d = getDriver(r.driverId);
    driverNames[r.driverId] = d?.name ?? r.driverId;
    driverPictures[r.driverId] = d?.picture;
    teamNames[r.teamId] = getTeam(r.teamId)?.name ?? r.teamId;
  }

  const headerTitle = ownerRound ? `Ronda ${String(ownerRound.index).padStart(2,"0")} · ${ownerRound.track.name}` : id;

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",   x: -80,  y: -60, w: 360, h: 360, opacity: 0.7, depth: 0.7 },
        { color: "amber", x: 700,  y: 200, w: 300, h: 300, opacity: 0.5, depth: 0.4 },
      ]}
      silhouette={ownerRound ? <TrackSilhouette track={ownerRound.track.id} opacity={0.07} /> : undefined}
      speedLines={session.status === "live"}
    >
      <TopNav />

      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb
          items={[
            { label: "CNSRC", href: "/" },
            { label: ownerChamp?.season ?? "—", href: ownerChamp ? `/championships/${ownerChamp.id}` : undefined },
            `Ronda ${ownerRound?.index ?? "—"}`,
            { label: ownerRound?.track.short ?? "—", href: ownerRound ? `/tracks/${ownerRound.track.id}` : undefined },
            session.subLabel ?? session.type.toUpperCase(),
          ]}
        />

        {/* YouTube banner */}
        {ownerRound?.youtubeUrl && <YouTubeBanner url={ownerRound.youtubeUrl} />}

        {/* Header */}
        <Reveal variant="clip">
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16 }} data-primary-red className={`fx-shine fx-shine--auto ${session.status === "live" ? "fx-glow-red" : ""}`}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Chip>{session.type.toUpperCase()}</Chip>
                {session.subLabel && <Chip>{session.subLabel}</Chip>}
                {session.status === "live" && <Chip tone="live">EN VIVO</Chip>}
              </div>
              <h1 className="fx-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                <TextScramble text={headerTitle} duration={900} />
              </h1>
            </div>
            {/* Conditions strip */}
            <Stagger style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "flex-end" }}>
              {[
                { label: "AIRE",  value: `${session.conditions.airTemp}°C` },
                { label: "PISTA", value: `${session.conditions.trackTemp}°C` },
                { label: "CLIMA", value: session.conditions.weather },
              ].map((c) => (
                <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                  <span className="label">{c.label}</span>
                  <span className="mono" style={{ fontSize: 15, color: "var(--text-primary)" }}>{c.value}</span>
                </div>
              ))}
            </Stagger>
          </div>
        </Glass>
        </Reveal>

        {/* Podium */}
        {hasPodium && (
          <Reveal variant="up" style={{ marginBottom: 20 }}>
            <SectionHeading eyebrow="RESULTADO" title="Podio" />
            <PodiumGroup
              podium={podiumRaw.map((r) => {
                const driver = getDriver(r.driverId);
                return {
                  pos: r.pos,
                  grid: r.gridPos,
                  delta: r.gridPos - r.pos,
                  name: driver?.name ?? r.driverId,
                  team: getTeam(r.teamId)?.name ?? r.teamId,
                  best: r.bestLap,
                  gap: r.gap,
                  picture: driver?.picture,
                };
              }) as [Parameters<typeof PodiumGroup>[0]["podium"][0], Parameters<typeof PodiumGroup>[0]["podium"][0], Parameters<typeof PodiumGroup>[0]["podium"][0]]}
            />
          </Reveal>
        )}

        {/* Full classification + Consistency + Race positions */}
        {session.results.length > 0 && (
          <Reveal variant="up" style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="CLASIFICACIÓN" title="Resultados completos" />
            <Glass cut={18} pad={0} aria-live={session.status === "live" ? "polite" : undefined}>
              <SessionViews
                results={session.results}
                laps={session.laps}
                driverNames={driverNames}
                driverPictures={driverPictures}
                teamNames={teamNames}
                isMultiClass={isMultiClass}
              />
            </Glass>
          </Reveal>
        )}

        {/* Points system */}
        {ownerChamp?.pointsTable && (
          <Reveal variant="up" style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="REGLAMENTO" title="Sistema de puntos" />
            <Glass cut={18} pad={0}>
              <PointsTableDisplay table={ownerChamp.pointsTable} />
            </Glass>
          </Reveal>
        )}

      </div>

      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
