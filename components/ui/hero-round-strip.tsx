"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export interface RoundItem {
  id: string;
  index: number;
  trackName: string;
  trackShort: string;
  date: string;
  status: "upcoming" | "live" | "done";
  sessionHref: string | null;
  isNext: boolean;
}

export function HeroRoundStrip({ rounds }: { rounds: RoundItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLAnchorElement | HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const card = nextCardRef.current;
    if (!container || !card) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const containerCenter = container.offsetWidth / 2;
    container.scrollLeft = cardCenter - containerCenter;
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-round-strip"
      style={{
        display: "flex",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        scrollBehavior: "smooth",
        gap: 2,
        padding: "10px 16px 12px",
      }}
    >

      {rounds.map((r) => {
        const isNext = r.isNext;
        const isDone = r.status === "done";
        const isLive = r.status === "live";

        const cardStyle: React.CSSProperties = {
          flexShrink: 0,
          width: 140,
          padding: "10px 10px 10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          scrollSnapAlign: "center",
          position: "relative",
          background: isNext || isLive
            ? "var(--bg-surface-p1)"
            : "rgba(255,255,255,0.02)",
          border: isNext || isLive
            ? "1px solid var(--border-accent)"
            : "1px solid var(--border-hairline)",
          opacity: !isDone && !isNext && !isLive ? 0.45 : 1,
          textDecoration: "none",
          cursor: r.sessionHref ? "pointer" : "default",
          transition: "opacity 150ms ease",
        };

        const inner = (
          <>
            {(isNext || isLive) && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: "var(--accent-red)",
                }}
              />
            )}
            <span
              className="label"
              style={{
                fontSize: 10,
                color: isNext || isLive ? "var(--accent-red)" : "var(--text-tertiary)",
              }}
            >
              {isLive ? "EN VIVO" : isNext ? "PRÓXIMA" : isDone ? "✓" : `R${String(r.index).padStart(2, "0")}`}
            </span>
            <span
              className="label"
              style={{
                fontSize: 10,
                color: "var(--text-tertiary)",
                letterSpacing: "0.1em",
              }}
            >
              R{String(r.index).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: 12,
                color: isNext || isLive ? "var(--text-primary)" : isDone ? "var(--text-secondary)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontWeight: isNext ? 600 : 400,
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {r.trackName}
            </span>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: "auto" }}
            >
              {r.date}
            </span>
          </>
        );

        if (r.sessionHref) {
          return (
            <Link
              key={r.id}
              href={r.sessionHref}
              style={cardStyle}
              ref={isNext || isLive ? (nextCardRef as React.RefObject<HTMLAnchorElement>) : undefined}
            >
              {inner}
            </Link>
          );
        }

        return (
          <div
            key={r.id}
            style={cardStyle}
            ref={isNext ? (nextCardRef as React.RefObject<HTMLDivElement>) : undefined}
          >
            {inner}
          </div>
        );
      })}

    </div>
  );
}
