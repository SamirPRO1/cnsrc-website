import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}

export function SectionHeading({ eyebrow, title, right }: SectionHeadingProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
        margin: "0 0 10px",
      }}
    >
      <div>
        {eyebrow && (
          <div className="label" style={{ marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}
