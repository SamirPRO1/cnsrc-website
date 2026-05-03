import type { ReactNode } from "react";

/**
 * Tiny safe markdown renderer for blog post bodies.
 *
 * Supported:
 *   # / ## / ### headings (line start)
 *   blank-line separated paragraphs
 *   **bold**, *italic*, `code`, [text](url)
 *
 * All input is escaped first; only the supported tokens are converted.
 */

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]);
}

type Inline =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "bold"; children: Inline[] }
  | { kind: "italic"; children: Inline[] }
  | { kind: "link"; href: string; children: Inline[] };

const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_RE.exec(src)) !== null) {
    if (m.index > last) {
      out.push({ kind: "text", value: src.slice(last, m.index) });
    }
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push({ kind: "code", value: tok.slice(1, -1) });
    } else if (tok.startsWith("**")) {
      out.push({ kind: "bold", children: parseInline(tok.slice(2, -2)) });
    } else if (tok.startsWith("*")) {
      out.push({ kind: "italic", children: parseInline(tok.slice(1, -1)) });
    } else if (tok.startsWith("[")) {
      const end = tok.indexOf("]");
      const text = tok.slice(1, end);
      const href = tok.slice(end + 2, -1);
      out.push({ kind: "link", href, children: parseInline(text) });
    }
    last = m.index + tok.length;
  }
  if (last < src.length) out.push({ kind: "text", value: src.slice(last) });
  return out;
}

function renderInline(tokens: Inline[], keyPrefix = ""): ReactNode[] {
  return tokens.map((t, i) => {
    const k = `${keyPrefix}-${i}`;
    switch (t.kind) {
      case "text":
        return <span key={k}>{t.value}</span>;
      case "code":
        return (
          <code
            key={k}
            className="mono"
            style={{ background: "var(--bg-surface)", padding: "1px 6px", border: "0.5px solid var(--border-hairline)", fontSize: 13 }}
          >
            {t.value}
          </code>
        );
      case "bold":
        return <strong key={k} style={{ color: "var(--text-primary)" }}>{renderInline(t.children, k)}</strong>;
      case "italic":
        return <em key={k}>{renderInline(t.children, k)}</em>;
      case "link":
        return (
          <a
            key={k}
            href={t.href}
            target={t.href.startsWith("http") ? "_blank" : undefined}
            rel={t.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="fx-link-underline"
            style={{ color: "var(--accent-red)", textDecoration: "none" }}
          >
            {renderInline(t.children, k)}
          </a>
        );
    }
  });
}

interface Block { kind: "h1" | "h2" | "h3" | "p"; text: string }

function parseBlocks(src: string): Block[] {
  // Normalise line endings, escape HTML once at the block boundary.
  const escaped = escape(src.replace(/\r\n/g, "\n"));
  const blocks: Block[] = [];
  for (const raw of escaped.split(/\n{2,}/)) {
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("### ")) blocks.push({ kind: "h3", text: t.slice(4) });
    else if (t.startsWith("## ")) blocks.push({ kind: "h2", text: t.slice(3) });
    else if (t.startsWith("# ")) blocks.push({ kind: "h1", text: t.slice(2) });
    else blocks.push({ kind: "p", text: t.replace(/\n/g, " ") });
  }
  return blocks;
}

const HEADING_BASE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  margin: "28px 0 10px",
  color: "var(--text-primary)",
};

export function PostBody({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 16,
        lineHeight: 1.7,
        color: "var(--text-secondary)",
      }}
    >
      {blocks.map((b, i) => {
        const inline = parseInline(b.text);
        const key = `b-${i}`;
        if (b.kind === "h1") return <h2 key={key} style={{ ...HEADING_BASE, fontSize: 28 }}>{renderInline(inline, key)}</h2>;
        if (b.kind === "h2") return <h3 key={key} style={{ ...HEADING_BASE, fontSize: 22 }}>{renderInline(inline, key)}</h3>;
        if (b.kind === "h3") return <h4 key={key} style={{ ...HEADING_BASE, fontSize: 18 }}>{renderInline(inline, key)}</h4>;
        return <p key={key} style={{ margin: "12px 0" }}>{renderInline(inline, key)}</p>;
      })}
    </div>
  );
}
