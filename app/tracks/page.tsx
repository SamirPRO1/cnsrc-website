import Link from "next/link";
import { listChampionships } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import type { TrackRef } from "@/lib/types";

export default function TracksIndexPage() {
  const champs = listChampionships();
  const seenIds = new Set<string>();
  const tracks: TrackRef[] = [];
  for (const c of champs)
    for (const r of c.rounds)
      if (!seenIds.has(r.track.id)) { seenIds.add(r.track.id); tracks.push(r.track); }

  return (
    <Backdrop
      orbs={[
        { color: "amber",  x: -60, y: -40, w: 340, h: 340, opacity: 0.5 },
        { color: "purple", x: 700, y: 200, w: 300, h: 300, opacity: 0.5 },
      ]}
      silhouette={<CompoundSilhouettes tracks={tracks.map(t=>t.id).slice(0,6)} opacity={0.05} />}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <SectionHeading eyebrow="TEMPORADA 03" title="Circuitos" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 8 }}>
          {tracks.map((t) => (
            <Link key={t.id} href={`/tracks/${t.id}`} style={{ textDecoration: "none" }}>
              <Glass cut={14} pad={16} style={{ cursor: "pointer" }}>
                <div className="label" style={{ marginBottom: 6 }}>{t.country}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-body)", marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                  <span className="mono" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.lengthKm} km</span>
                  <span className="label" style={{ color: "var(--text-tertiary)" }}>{t.turns} curvas</span>
                  <span className="label" style={{ color: "var(--text-tertiary)" }}>{t.layout}</span>
                </div>
              </Glass>
            </Link>
          ))}
        </div>
      </div>
      <CNSRCFooter />
    </Backdrop>
  );
}
