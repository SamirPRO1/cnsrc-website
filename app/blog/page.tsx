import Link from "next/link";
import { listPublishedPosts } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { SectionHeading } from "@/components/ui/section-heading";
import { CNSRCFooter } from "@/components/ui/footer";
import { CompoundSilhouettes } from "@/components/ui/track-silhouette";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { Stagger } from "@/components/ui/effects/Stagger";
import { Tilt } from "@/components/ui/effects/Tilt";

export const metadata = { title: "Blog — CNSRC" };
export const revalidate = 30;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default function BlogIndexPage() {
  const posts = listPublishedPosts();

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -80, y: -40, w: 360, h: 360, opacity: 0.6, depth: 0.6 },
        { color: "purple", x: 720, y: 240, w: 320, h: 320, opacity: 0.5, depth: 0.4 },
      ]}
      silhouette={<CompoundSilhouettes tracks={["bahrain", "interlagos", "cota"]} opacity={0.05} />}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px" }}>
        <Reveal variant="slide-l">
          <SectionHeading eyebrow="CNSRC" title="Blog" />
        </Reveal>

        {posts.length === 0 ? (
          <Glass cut={18} pad={32}>
            <div style={{ textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              Aún no hay publicaciones.
            </div>
          </Glass>
        ) : (
          <Stagger style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`} style={{ textDecoration: "none" }}>
                <Tilt max={3} scale={1.005}>
                  <Glass cut={14} pad={20} style={{ cursor: "pointer" }}>
                    <article style={{ display: "grid", gridTemplateColumns: p.coverImage ? "160px 1fr" : "1fr", gap: 20, alignItems: "stretch" }}>
                      {p.coverImage && (
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="fx-portrait"
                          style={{ width: 160, height: 110, objectFit: "cover", border: "1px solid var(--border-hairline)" }}
                        />
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <span className="label" style={{ color: "var(--accent-red)" }}>{formatDate(p.publishedAt)}</span>
                          {p.author && <span className="label" style={{ color: "var(--text-tertiary)" }}>· {p.author}</span>}
                          {p.tags?.map((t) => (
                            <span key={t} className="chip">{t}</span>
                          ))}
                        </div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", margin: 0, color: "var(--text-primary)" }}>
                          {p.title}
                        </h2>
                        {p.excerpt && (
                          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                            {p.excerpt}
                          </p>
                        )}
                        <span className="fx-link-underline" style={{ marginTop: "auto", fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.18em", color: "var(--accent-red)" }}>LEER →</span>
                      </div>
                    </article>
                  </Glass>
                </Tilt>
              </Link>
            ))}
          </Stagger>
        )}
      </div>
      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
