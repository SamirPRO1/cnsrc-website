"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@%&!?*";

interface TextScrambleProps {
  text: string;
  /** Delay before scrambling starts, ms. */
  startDelay?: number;
  /** Time between frames, ms. */
  frameMs?: number;
  /** Total scramble duration, ms. */
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reveals `text` by scrambling each character to its final glyph.
 * Triggers when the element scrolls into view.
 */
export function TextScramble({
  text,
  startDelay = 0,
  frameMs = 35,
  duration = 900,
  className = "",
  style,
}: TextScrambleProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [out, setOut] = useState<string>(" ".repeat(text.length));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let raf = 0;

    const start = () => {
      const startTs = performance.now() + startDelay;
      const total = duration;

      function frame(now: number) {
        if (cancelled) return;
        const t = Math.max(0, Math.min(1, (now - startTs) / total));
        const settled = Math.floor(t * text.length);
        const next = text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < settled) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("");
        setOut(next);
        if (t < 1) {
          setTimeout(() => {
            raf = requestAnimationFrame(frame);
          }, frameMs);
        } else {
          setOut(text);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
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
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, startDelay, frameMs, duration]);

  return (
    <span ref={ref} className={className} style={style} suppressHydrationWarning>
      {out}
    </span>
  );
}
