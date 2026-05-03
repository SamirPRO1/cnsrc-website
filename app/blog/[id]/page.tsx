import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedPost, listPublishedPosts } from "@/lib/data";
import { TopNav } from "@/components/ui/top-nav";
import { Glass } from "@/components/ui/glass";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Chip } from "@/components/ui/chip";
import { CNSRCFooter } from "@/components/ui/footer";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { TextScramble } from "@/components/ui/effects/TextScramble";
import { PostBody } from "@/components/ui/post-body";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getPublishedPost(id);
  if (!post) return { title: "Blog — CNSRC" };
  return { title: `${post.title} — CNSRC`, description: post.excerpt || undefined };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getPublishedPost(id);
  if (!post) notFound();

  const all = listPublishedPosts();
  const idx = all.findIndex((p) => p.id === post.id);
  const prev = idx >= 0 ? all[idx + 1] ?? null : null;   // older
  const next = idx > 0  ? all[idx - 1] ?? null : null;   // newer

  return (
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -80, y: -40, w: 360, h: 360, opacity: 0.6, depth: 0.6 },
        { color: "purple", x: 720, y: 220, w: 320, h: 320, opacity: 0.5, depth: 0.4 },
      ]}
    >
      <TopNav />
      <div style={{ padding: "0 24px 32px", maxWidth: 880, margin: "0 auto" }}>
        <Breadcrumb items={[{ label: "CNSRC", href: "/" }, { label: "Blog", href: "/blog" }, post.title]} />

        <Reveal variant="clip">
          <Glass cut={22} heavy stripe pad={28} style={{ marginBottom: 16 }} data-primary-red className="fx-shine fx-shine--auto fx-glow-red">
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Chip>{formatDate(post.publishedAt)}</Chip>
              {post.author && <Chip>{post.author}</Chip>}
              {post.tags?.map((t) => <Chip key={t}>{t}</Chip>)}
            </div>
            <h1 className="fx-headline" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, textTransform: "uppercase", letterSpacing: "0.01em", margin: 0, color: "var(--text-primary)", lineHeight: 1.05 }}>
              <TextScramble text={post.title} duration={900} />
            </h1>
            {post.excerpt && (
              <p style={{ marginTop: 14, marginBottom: 0, color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.55, maxWidth: 720 }}>
                {post.excerpt}
              </p>
            )}
          </Glass>
        </Reveal>

        {post.coverImage && (
          <Reveal variant="fade">
            <img
              src={post.coverImage}
              alt={post.title}
              className="fx-portrait"
              style={{ width: "100%", maxHeight: 420, objectFit: "cover", marginBottom: 20, border: "1px solid var(--border-hairline)" }}
            />
          </Reveal>
        )}

        <Reveal variant="up">
          <Glass cut={18} pad={28}>
            <PostBody source={post.body} />
          </Glass>
        </Reveal>

        {(prev || next) && (
          <Reveal variant="up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
            <div>
              {prev && (
                <Link href={`/blog/${prev.id}`} style={{ textDecoration: "none" }}>
                  <Glass cut={14} pad={14} className="fx-lift">
                    <span className="label">← ANTERIOR</span>
                    <div style={{ marginTop: 4, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)" }}>{prev.title}</div>
                  </Glass>
                </Link>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {next && (
                <Link href={`/blog/${next.id}`} style={{ textDecoration: "none" }}>
                  <Glass cut={14} pad={14} className="fx-lift">
                    <span className="label">SIGUIENTE →</span>
                    <div style={{ marginTop: 4, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)" }}>{next.title}</div>
                  </Glass>
                </Link>
              )}
            </div>
          </Reveal>
        )}
      </div>
      <CNSRCFooter />
    </ParallaxBackdrop>
  );
}
