"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Number of digits to pad with leading zeros (e.g. 2 -> "07"). */
  pad?: number;
  /** Optional suffix appended after the number (e.g. "/14"). */
  suffix?: string;
  /** Optional prefix (e.g. "P"). */
  prefix?: string;
  /** Decimal places to show. */
  decimals?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Counts from 0 to `value` once the element scrolls into view.
 * Non-numeric children are not supported — use plain text spans for those.
 */
export function AnimatedNumber({
  value,
  duration = 1100,
  pad = 0,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
  style,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let startedAt = 0;
    const safe = Number.isFinite(value) ? value : 0;

    function step(ts: number) {
      if (!startedAt) startedAt = ts;
      const t = Math.min(1, (ts - startedAt) / duration);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(safe * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    }

    function start() {
      cancelAnimationFrame(raf);
      startedAt = 0;
      raf = requestAnimationFrame(step);
    }

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : String(Math.round(display)).padStart(pad, "0");

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
