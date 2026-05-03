"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface StaggerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  threshold?: number;
  /** When true, render children hidden until the container scrolls into view. */
  whenInView?: boolean;
}

/**
 * Wraps a list. When in view, descendant children fade up in sequence
 * via CSS rules on `.fx-stagger > *`.
 */
export function Stagger({
  children,
  className = "",
  style,
  threshold = 0.1,
  whenInView = true,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(!whenInView);

  useEffect(() => {
    if (!whenInView) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, whenInView]);

  return (
    <div
      ref={ref}
      className={`${visible ? "fx-stagger" : ""} ${className}`.trim()}
      style={{ ...(visible ? null : { visibility: "hidden" }), ...style }}
    >
      {children}
    </div>
  );
}
