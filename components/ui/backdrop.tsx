import type { CSSProperties, ReactNode } from "react";

interface Orb {
  color: "red" | "amber" | "purple";
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
}

interface BackdropProps {
  children: ReactNode;
  orbs?: Orb[];
  silhouette?: ReactNode;
  bracketCorners?: boolean;
}

const bracketBase: CSSProperties = {
  position: "absolute",
  width: 18,
  height: 18,
  border: "1px solid var(--text-tertiary)",
  opacity: 0.35,
  pointerEvents: "none",
};

export function Backdrop({ children, orbs = [], silhouette, bracketCorners }: BackdropProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "var(--bg-page)",
        overflow: "hidden",
        color: "var(--text-primary)",
      }}
    >
      {orbs.map((o, i) => (
        <div
          key={i}
          className={`orb orb--${o.color}`}
          aria-hidden="true"
          style={{ width: o.w, height: o.h, left: o.x, top: o.y, opacity: o.opacity ?? 1 }}
        />
      ))}

      {silhouette && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        >
          {silhouette}
        </div>
      )}

      {bracketCorners && (
        <>
          <div aria-hidden="true" style={{ ...bracketBase, top: 20, left: 20, borderRight: 0, borderBottom: 0 }} />
          <div aria-hidden="true" style={{ ...bracketBase, top: 20, right: 20, borderLeft: 0, borderBottom: 0 }} />
          <div aria-hidden="true" style={{ ...bracketBase, bottom: 20, left: 20, borderRight: 0, borderTop: 0 }} />
          <div aria-hidden="true" style={{ ...bracketBase, bottom: 20, right: 20, borderLeft: 0, borderTop: 0 }} />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
