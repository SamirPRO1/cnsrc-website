import Link from "next/link";
import { listChampionships } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes, TrackSilhouette } from "@/components/ui/track-silhouette";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { Tilt } from "@/components/ui/effects/Tilt";
import type { TrackRef } from "@/lib/types";

export default function TracksIndexPage() {
  const champs = listChampionships();
  const seenIds = new Set<string>();
  const tracks: TrackRef[] = [];
  for (const c of champs)
    for (const r of c.rounds)
      if (!seenIds.has(r.track.id)) { seenIds.add(r.track.id); tracks.push(r.track); }

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "amber",  x: -60, y: -40, w: 340, h: 340, opacity: 0.5, depth: 0.6 },
        { color: "purple", x: 700, y: 200, w: 300, h: 300, opacity: 0.5, depth: 0.4 },
      ]}
      silhouette={<CompoundSilhouettes tracks={tracks.map(t=>t.id).slice(0,6)} opacity={0.05} />}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <Reveal variant="slide-l">
          <SectionHeading eyebrow="TEMPORADA 03" title="Circuitos" />
        </Reveal>
        <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 8 }}>
          {tracks.map((t) => (
            <Link key={t.id} href={`/tracks/${t.id}`} style={{ textDecoration: "none" }}>
              <Tilt max={6} scale={1.015}>
                <Glass cut={14} pad={16} style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}>
                  <div aria-hidden="true" style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, opacity: 0.5, pointerEvents: "none" }}>
                    <TrackSilhouette track={t.id} opacity={0.18} strokeWidth={2} />
                  </div>
                  <div className="label" style={{ marginBottom: 6, position: "relative" }}>{t.country}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-body)", marginBottom: 4, position: "relative" }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 6, position: "relative" }}>
                    <span className="mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.lengthKm} km</span>
                    <span className="label" style={{ color: "var(--text-tertiary)" }}>{t.turns} curvas</span>
                    <span className="label" style={{ color: "var(--text-tertiary)" }}>{t.layout}</span>
                  </div>
                </Glass>
              </Tilt>
            </Link>
          ))}
        </Stagger>
      </div>
      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
