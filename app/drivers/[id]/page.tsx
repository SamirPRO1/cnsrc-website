import { notFound } from "next/navigation";
import { getDriverProfile, listDrivers } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { Chip } from "@/components/ui/chip";
import { SeasonsTable } from "@/components/driver/seasons-table";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { AnimatedNumber } from "@/components/ui/effects/AnimatedNumber";
import { TextScramble } from "@/components/ui/effects/TextScramble";

export async function generateStaticParams() {
  return listDrivers().map((d) => ({ id: d.id }));
}

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getDriverProfile(id);
  if (!profile) notFound();

  const currentSeason = profile.seasons.at(-1);

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -80, y: -40, w: 340, h: 340, opacity: 0.7, depth: 0.6 },
        { color: "purple", x: 700, y: 200, w: 300, h: 300, opacity: 0.5, depth: 0.4 },
      ]}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb items={[{ label: "CNSRC", href: "/" }, { label: "Pilotos", href: "/drivers" }, profile.name]} />

        {/* Hero */}
        <Reveal variant="clip">
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16 }} data-primary-red className="fx-shine fx-shine--auto fx-glow-red">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
            {profile.picture ? (
              <img
                src={profile.picture}
                alt={profile.name}
                className="fx-portrait"
                style={{
                  width: 96,
                  height: 96,
                  objectFit: "cover",
                  border: "2px solid var(--border-hairline)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 80, lineHeight: 1, color: "var(--accent-red)", fontVariantNumeric: "tabular-nums" }}>
                {profile.number}
              </span>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <Chip>{profile.license} LICENCIA</Chip>
                <Chip>{profile.country}</Chip>
                <Chip>DESDE {profile.joined}</Chip>
              </div>
              <h1 className="fx-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, textTransform: "uppercase", letterSpacing: "0.01em", margin: 0, color: "var(--text-primary)" }}>
                <TextScramble text={profile.name} duration={900} />
              </h1>
              {profile.description && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", marginTop: 10, marginBottom: 0, lineHeight: 1.6, maxWidth: 520 }}>
                  {profile.description}
                </p>
              )}
            </div>
            {currentSeason && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
                {currentSeason.classId === "am" && (
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 10, letterSpacing: "0.2em", color: "var(--status-warning)", border: "0.5px solid var(--status-warning)", padding: "2px 7px" }}>
                    CLASE AM
                  </span>
                )}
                <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                  {[
                    { label: "POSICIÓN",  num: currentSeason.pos, prefix: "P", accent: currentSeason.pos === 1 },
                    { label: "PUNTOS",    num: currentSeason.pts },
                    { label: currentSeason.classId === "am" ? "VICTORIAS AM" : "VICTORIAS", num: currentSeason.wins },
                    { label: currentSeason.classId === "am" ? "PODIOS AM"    : "PODIOS",    num: currentSeason.podiums },
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className="label">{s.label}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: s.accent ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        <AnimatedNumber value={s.num} prefix={s.prefix ?? ""} />
                      </span>
                    </div>
                  ))}
                </Stagger>
              </div>
            )}
          </div>
        </Glass>
        </Reveal>

        {/* Form strip */}
        {profile.formStrip.length > 0 && (
          <Reveal variant="up" style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="FORMA EN TEMPORADA" title="Ronda a ronda" />
            <Stagger style={{ display: "grid", gridTemplateColumns: `repeat(${profile.formStrip.length}, 1fr)`, gap: 5 }}>
              {profile.formStrip.map((f) => (
                <Glass
                  key={f.roundIndex}
                  cut={14}
                  pad={10}
                  style={{ opacity: f.status === "upcoming" ? 0.4 : 1, textAlign: "center" }}
                  className="fx-lift"
                >
                  <div className="label" style={{ marginBottom: 5 }}>{f.trackShort}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {f.r1Pos !== null && (
                      <span className="mono" style={{ fontSize: 13, color: f.r1Pos === 1 ? "var(--accent-red)" : "var(--text-primary)" }}>
                        P{f.r1Pos}
                      </span>
                    )}
                    {f.r2Pos !== null && (
                      <span className="mono" style={{ fontSize: 13, color: f.r2Pos === 1 ? "var(--accent-red)" : "var(--text-primary)" }}>
                        P{f.r2Pos}
                      </span>
                    )}
                    {f.r1Pos === null && f.r2Pos === null && (
                      <span className="label">—</span>
                    )}
                  </div>
                  {f.hasFl && <span className="pulse" style={{ color: "var(--status-warning)", fontSize: 11 }}>✦</span>}
                </Glass>
              ))}
            </Stagger>
          </Reveal>
        )}

        {/* Career seasons */}
        {profile.seasons.length > 0 && (
          <Reveal variant="slide-l" style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="TRAYECTORIA" title="Historial de temporadas" />
            <Glass cut={18} pad={0}>
              <SeasonsTable seasons={profile.seasons} />
            </Glass>
          </Reveal>
        )}

        {/* Track bests */}
        {profile.trackBests.length > 0 && (
          <Reveal variant="up">
            <SectionHeading eyebrow="RÉCORDS PERSONALES" title="Mejores por circuito" />
            <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 8 }}>
              {profile.trackBests.map((tb, i) => (
                <Glass key={i} cut={14} pad={14} className="fx-lift">
                  <div className="label" style={{ marginBottom: 5 }}>{tb.trackName.toUpperCase()}</div>
                  <div className="mono" style={{ fontSize: 20, color: "var(--text-primary)" }}>{tb.time}</div>
                  <div className="label" style={{ marginTop: 4 }}>{tb.classId.toUpperCase()}</div>
                </Glass>
              ))}
            </Stagger>
          </Reveal>
        )}
      </div>
      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
