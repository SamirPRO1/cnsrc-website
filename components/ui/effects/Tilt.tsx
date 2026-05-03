"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

interface TiltProps {
  children: ReactNode;
  /** Max rotation in degrees on each axis. */
  max?: number;
  /** Optional scale on hover. */
  scale?: number;
  glare?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * 3D mouse-tracked tilt with optional cursor glare.
 * Uses CSS custom properties so the highlight is GPU-cheap.
 */
export function Tilt({
  children,
  max = 6,
  scale = 1.01,
  glare = true,
  className = "",
  style,
}: TiltProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - y) * max * 2;
    const ry = (x - 0.5) * max * 2;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.dataset.active = "1";
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
    el.dataset.active = "0";
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`fx-tilt ${glare ? "fx-tilt--glare" : ""} ${className}`.trim()}
      style={{ position: "relative", ...style }}
    >
      {children}
    </div>
  );
}
