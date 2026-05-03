"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface Orb {
  color: "red" | "amber" | "purple";
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  /** Parallax depth — 0 = static, 1 = strong follow. Default 0.4. */
  depth?: number;
}

interface ParallaxBackdropProps {
  children: ReactNode;
  orbs?: Orb[];
  silhouette?: ReactNode;
  bracketCorners?: boolean;
  /** Add the diagonal speed-line streaks. */
  speedLines?: boolean;
}

const bracketBase: CSSProperties = {
  position: "absolute",
  width: 18,
  height: 18,
  border: "1px solid var(--text-tertiary)",
  opacity: 0.35,
  pointerEvents: "none",
};

/**
 * A drop-in replacement for <Backdrop> that adds:
 *  - mouse parallax on each orb (with per-orb depth)
 *  - subtle scroll parallax on the silhouette
 *  - optional diagonal speed-line streaks
 */
export function ParallaxBackdrop({
  children,
  orbs = [],
  silhouette,
  bracketCorners,
  speedLines,
}: ParallaxBackdropProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const orbRefs = useRef<HTMLDivElement[]>([]);
  const silhouetteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let mx = 0, my = 0;

    function onMove(e: PointerEvent) {
      const rect = root!.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width - 0.5;
      my = (e.clientY - rect.top) / rect.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    }

    function apply() {
      raf = 0;
      orbRefs.current.forEach((el, i) => {
        if (!el) return;
        const depth = Number(el.dataset.depth ?? "0.4");
        const tx = -mx * 60 * depth;
        const ty = -my * 60 * depth;
        el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
        void i;
      });
    }

    function onScroll() {
      if (silhouetteRef.current) {
        const y = window.scrollY * 0.06;
        silhouetteRef.current.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
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
          ref={(node) => {
            if (node) orbRefs.current[i] = node;
          }}
          data-depth={o.depth ?? 0.4}
          className={`orb orb--${o.color} fx-parallax-orb`}
          aria-hidden="true"
          style={{ width: o.w, height: o.h, left: o.x, top: o.y, opacity: o.opacity ?? 1 }}
        />
      ))}

      {silhouette && (
        <div
          ref={silhouetteRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            transition: "transform 600ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {silhouette}
        </div>
      )}

      {speedLines && (
        <div className="fx-speedlines" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${(i + 1) * 5.4}%`,
                animationDelay: `${(i % 6) * 0.6}s`,
                animationDuration: `${4 + (i % 4)}s`,
                opacity: 0.18 + (i % 5) * 0.08,
              }}
            />
          ))}
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
