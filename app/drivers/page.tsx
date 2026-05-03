import Link from "next/link";
import { listDrivers, listTeams, getDriverRaceCount } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { Tilt } from "@/components/ui/effects/Tilt";

export default function DriversIndexPage() {
  const drivers = listDrivers().sort((a, b) => getDriverRaceCount(b.id) - getDriverRaceCount(a.id));
  const teams   = listTeams();
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "purple", x: -80,  y: -40, w: 380, h: 380, opacity: 0.6, depth: 0.7 },
        { color: "amber",  x: 700,  y: 300, w: 280, h: 280, opacity: 0.4, depth: 0.4 },
      ]}
      silhouette={<CompoundSilhouettes tracks={["bahrain","interlagos","cota"]} opacity={0.05} />}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <Reveal variant="slide-l">
          <SectionHeading eyebrow="TEMPORADA 03" title="Pilotos" />
        </Reveal>
        <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 8 }}>
          {drivers.map((d) => (
            <Link key={d.id} href={`/drivers/${d.id}`} style={{ textDecoration: "none" }}>
              <Tilt max={5}>
                <Glass cut={14} pad={16} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {d.picture ? (
                      <img
                        src={d.picture}
                        alt={d.name}
                        className="fx-portrait"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          border: "1px solid var(--border-hairline)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", width: 56, flexShrink: 0, textAlign: "center" }}>
                        {d.number}
                      </span>
                    )}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>{d.name}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{teamMap.get(d.teamId) ?? d.teamId}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                        <span className="chip">{d.license}</span>
                        <span className="label" style={{ color: "var(--text-tertiary)" }}>{getDriverRaceCount(d.id)} CARRERAS</span>
                      </div>
                    </div>
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
