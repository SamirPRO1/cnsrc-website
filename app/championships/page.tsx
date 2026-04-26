import Link from "next/link";
import { listChampionships } from "@/lib/data";
import { Backdrop } from "@/components/ui/backdrop";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { Chip } from "@/components/ui/chip";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";

export default function ChampionshipsIndexPage() {
  const championships = listChampionships();

  return (
    <Backdrop
      orbs={[
        { color: "red",    x: -80,  y: -40, w: 380, h: 380, opacity: 0.7 },
        { color: "purple", x: 700,  y: 200, w: 300, h: 300, opacity: 0.5 },
      ]}
      silhouette={<CompoundSilhouettes tracks={["bahrain", "interlagos", "cota"]} opacity={0.05} />}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <SectionHeading eyebrow="CNSRC" title="Campeonatos" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {championships.map((c) => {
            const done = c.rounds.filter((r) => r.status === "done").length;
            return (
              <Link key={c.id} href={`/championships/${c.id}`} style={{ textDecoration: "none" }}>
                <Glass cut={14} pad={18} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1, flexShrink: 0, minWidth: 80 }}>
                      {c.year}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 5 }}>{c.name}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Chip>{c.season}</Chip>
                        {c.classes.map((cls) => (
                          <Chip key={cls.id}>{cls.label}</Chip>
                        ))}
                        {c.status === "live" && <Chip tone="live">EN VIVO</Chip>}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flexShrink: 0, textAlign: "right" }}>
                      {[
                        { label: "RONDAS", value: String(c.rounds.length) },
                        { label: "HECHAS", value: String(done) },
                      ].map((s) => (
                        <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span className="label">{s.label}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.18em", color: "var(--accent-red)", flexShrink: 0 }}>VER →</span>
                  </div>
                </Glass>
              </Link>
            );
          })}
        </div>
      </div>
      <CNSRCFooter />
    </Backdrop>
  );
}
