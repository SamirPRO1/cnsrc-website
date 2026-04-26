import type { CSSProperties, ReactNode } from "react";

interface GlassProps {
  cut?: 14 | 18 | 22;
  children: ReactNode;
  stripe?: boolean;
  heavy?: boolean;
  pad?: number;
  style?: CSSProperties;
  className?: string;
  "data-primary-red"?: boolean;
}

export function Glass({
  cut = 18,
  children,
  stripe = false,
  heavy = false,
  pad = 16,
  style,
  className = "",
  "data-primary-red": primaryRed,
}: GlassProps) {
  const clipClass =
    cut === 14 ? "clip-cut-sm" : cut === 22 ? "clip-cut-lg" : "clip-cut-md";

  return (
    <div
      className={`glass ${clipClass} ${className}`}
      style={{
        backdropFilter: heavy ? "var(--blur-heavy)" : "var(--blur-medium)",
        WebkitBackdropFilter: heavy ? "var(--blur-heavy)" : "var(--blur-medium)",
        padding: pad,
        position: "relative",
        ...style,
      }}
      {...(primaryRed ? { "data-primary-red": "true" } : {})}
    >
      {stripe && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "var(--accent-red)",
            zIndex: 3,
          }}
        />
      )}
      {children}
    </div>
  );
}
