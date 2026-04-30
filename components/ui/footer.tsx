import Image from "next/image";

const SPONSORS: { src: string | null; href?: string }[] = [
  { src: "/sponsors/acc.png", href: "https://www.instagram.com/automovil_club_de_cuba/" },
  { src: "/sponsors/adec.png", href: "https://adecesports.com/" },
  { src: null },
  { src: null },
  { src: null },
  { src: null },
];

export function CNSRCFooter() {
  return (
    <footer
      className="footer-grid"
      style={{
        marginTop: 36,
        padding: "28px 24px 24px",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div>
        <Image src="/sponsors/cnsrc.png" alt="CNSRC" width={100} height={28} style={{ objectFit: "contain", width: "auto", height: 28 }} />
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 10, maxWidth: 240, lineHeight: 1.5 }}>
          Campeonato Nacional Simracing Cuba — liga de simracing en Assetto Corsa.
        </div>
      </div>

      <div>
        <div className="label" style={{ marginBottom: 10 }}>PATROCINADORES</div>
        <div className="sponsors-grid">
          {SPONSORS.map(({ src, href }, i) => {
            const inner = src ? (
              <Image src={src} alt={`Sponsor ${i + 1}`} fill style={{ objectFit: "contain", padding: "6px 8px" }} />
            ) : (
              `slot·${String(i + 1).padStart(2, "0")}`
            );
            const style = {
              height: 40,
              background: "var(--bg-surface)",
              border: "0.5px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              position: "relative" as const,
              overflow: "hidden" as const,
            };
            return href ? (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="clip-cut-sm" style={{ ...style, textDecoration: "none" }}>
                {inner}
              </a>
            ) : (
              <div key={i} className="clip-cut-sm" style={style}>{inner}</div>
            );
          })}
        </div>
      </div>

      <div className="footer-links" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <a
          href="https://discord.gg/cnsrc"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 12,
            letterSpacing: "0.2em",
            color: "var(--text-primary)",
            textDecoration: "none",
          }}
        >
          DISCORD →
        </a>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>© 2026 CNSRC</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          v0.1 · TEMPORADA 03
        </span>
      </div>
    </footer>
  );
}
