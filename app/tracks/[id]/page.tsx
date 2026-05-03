import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrackDetail, listChampionships } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { DataTable } from "@/components/ui/data-table";
import { CNSRCFooter } from "@/components/ui/footer";
import { TrackSilhouette } from "@/components/ui/track-silhouette";
import { Chip } from "@/components/ui/chip";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { AnimatedNumber } from "@/components/ui/effects/AnimatedNumber";
import { TextScramble } from "@/components/ui/effects/TextScramble";
import type { TrackRecord } from "@/lib/types";

export async function generateStaticParams() {
  const champs = listChampionships();
  const ids = new Set<string>();
  champs.forEach((c) => c.rounds.forEach((r) => ids.add(r.track.id)));
  return [...ids].map((id) => ({ id }));
}

const RECORD_COLS = [
  { key: "classId",    label: "AUTO",    render: (r: TrackRecord) => <span className="chip">{r.carName}</span> },
  { key: "time",       label: "TIEMPO",  mono: true, accentIfLeader: true },
  { key: "driverName", label: "PILOTO" },
  { key: "teamName",   label: "EQUIPO" },
  { key: "date",       label: "FECHA",   mono: true },
] satisfies import("@/components/ui/data-table").Column<TrackRecord>[];

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = getTrackDetail(id);
  if (!track) notFound();

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "amber",  x: -60, y: -40, w: 320, h: 320, opacity: 0.6, depth: 0.6 },
        { color: "red",    x: 700, y: 300, w: 280, h: 280, opacity: 0.5, depth: 0.4 },
      ]}
      silhouette={<TrackSilhouette track={track.id} opacity={0.08} />}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb items={[{ label: "CNSRC", href: "/" }, { label: "Circuitos", href: "/tracks" }, track.name]} />

        {/* Hero */}
        <Reveal variant="clip">
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16, position: "relative", overflow: "hidden" }} data-primary-red className="fx-shine fx-shine--auto fx-glow-red">
          <div aria-hidden="true" style={{ position: "absolute", right: -40, top: -20, width: 320, height: 220, opacity: 0.7, pointerEvents: "none" }}>
            <TrackSilhouette track={track.id} opacity={0.16} strokeWidth={2} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, position: "relative" }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Chip>{track.country}</Chip>
                <Chip>{track.layout}</Chip>
              </div>
              <h1 className="fx-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                <TextScramble text={track.name} duration={900} />
              </h1>
            </div>
            <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, flexShrink: 0 }}>
              {[
                { label: "LONGITUD", num: track.lengthKm, decimals: 3, suffix: " KM" },
                { label: "CURVAS",   num: track.turns },
                { label: "TRAZADO",  text: track.layout },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="label">{s.label}</span>
                  <span className="mono" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                    {"text" in s ? s.text : <AnimatedNumber value={s.num!} decimals={s.decimals ?? 0} suffix={s.suffix ?? ""} />}
                  </span>
                </div>
              ))}
            </Stagger>
          </div>
        </Glass>
        </Reveal>

        {/* Records */}
        {track.records.length > 0 && (
          <Reveal variant="up" style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="RÉCORDS DE VUELTA" title="Vueltas rápidas por clase" />
            <Glass cut={18} pad={0}>
              <DataTable columns={RECORD_COLS} rows={track.records} leaderRowIndex={0} />
            </Glass>
          </Reveal>
        )}

        {/* Session history */}
        {track.sessions.length > 0 && (
          <Reveal variant="up">
            <SectionHeading eyebrow="HISTORIAL" title="Sesiones disputadas" />
            <Stagger style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {track.sessions.map((s) => (
                <Link key={s.id} href={`/sessions/${s.id}`} style={{ textDecoration: "none" }} className="fx-lift">
                <Glass cut={14} pad={14} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{s.label}</div>
                      <div className="label" style={{ marginTop: 3 }}>{s.date}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {(() => {
                        const isMultiClass = new Set(s.podium.map((p) => p.classId)).size > 1;
                        return s.podium.map((entry, i) => (
                          <div key={i} className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 ? "var(--accent)" : "var(--text-secondary)" }}>
                              {isMultiClass ? (entry.classId === "am" ? "AM" : "PRO") : `P${i + 1}`}
                            </span>
                            <span style={{ color: "var(--text-primary)" }}>{entry.name}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </Glass>
                </Link>
              ))}
            </Stagger>
          </Reveal>
        )}
      </div>
      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
