import { notFound } from "next/navigation";
import { getDriverProfile, listDrivers } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { Chip } from "@/components/ui/chip";
import { SeasonsTable } from "@/components/driver/seasons-table";

export async function generateStaticParams() {
  return listDrivers().map((d) => ({ id: d.id }));
}

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getDriverProfile(id);
  if (!profile) notFound();

  const currentSeason = profile.seasons.at(-1);

  return (
    <Backdrop
      orbs={[
        { color: "red",    x: -80, y: -40, w: 340, h: 340, opacity: 0.7 },
        { color: "purple", x: 700, y: 200, w: 300, h: 300, opacity: 0.5 },
      ]}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <Breadcrumb items={[{ label: "CNSRC", href: "/" }, { label: "Pilotos", href: "/drivers" }, profile.name]} />

        {/* Hero */}
        <Glass cut={22} heavy stripe pad={22} style={{ marginBottom: 16 }} data-primary-red>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
            {profile.picture ? (
              <img
                src={profile.picture}
                alt={profile.name}
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
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, textTransform: "uppercase", letterSpacing: "0.01em", margin: 0, color: "var(--text-primary)" }}>
                {profile.name}
              </h1>
              {profile.description && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", marginTop: 10, marginBottom: 0, lineHeight: 1.6, maxWidth: 520 }}>
                  {profile.description}
                </p>
              )}
            </div>
            {currentSeason && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, flexShrink: 0 }}>
                {[
                  { label: "POSICIÓN", value: `P${currentSeason.pos}`, accent: currentSeason.pos === 1 },
                  { label: "PUNTOS",   value: String(currentSeason.pts) },
                  { label: "VICTORIAS",value: String(currentSeason.wins) },
                  { label: "PODIOS",   value: String(currentSeason.podiums) },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span className="label">{s.label}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: s.accent ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Glass>

        {/* Form strip */}
        {profile.formStrip.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="FORMA EN TEMPORADA" title="Ronda a ronda" />
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${profile.formStrip.length}, 1fr)`, gap: 5 }}>
              {profile.formStrip.map((f) => (
                <Glass
                  key={f.roundIndex}
                  cut={14}
                  pad={10}
                  style={{ opacity: f.status === "upcoming" ? 0.4 : 1, textAlign: "center" }}
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
                  {f.hasFl && <span style={{ color: "var(--status-warning)", fontSize: 11 }}>✦</span>}
                </Glass>
              ))}
            </div>
          </div>
        )}

        {/* Career seasons */}
        {profile.seasons.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeading eyebrow="TRAYECTORIA" title="Historial de temporadas" />
            <Glass cut={18} pad={0}>
              <SeasonsTable seasons={profile.seasons} />
            </Glass>
          </div>
        )}

        {/* Track bests */}
        {profile.trackBests.length > 0 && (
          <div>
            <SectionHeading eyebrow="RÉCORDS PERSONALES" title="Mejores por circuito" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 8 }}>
              {profile.trackBests.map((tb, i) => (
                <Glass key={i} cut={14} pad={14}>
                  <div className="label" style={{ marginBottom: 5 }}>{tb.trackName.toUpperCase()}</div>
                  <div className="mono" style={{ fontSize: 20, color: "var(--text-primary)" }}>{tb.time}</div>
                  <div className="label" style={{ marginTop: 4 }}>{tb.classId.toUpperCase()}</div>
                </Glass>
              ))}
            </div>
          </div>
        )}
      </div>
      <CNSRCFooter />
    </Backdrop>
  );
}
