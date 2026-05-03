import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  /** Animation duration in seconds. Lower = faster. Default 28s. */
  duration?: number;
  className?: string;
}

/**
 * Renders the children twice back-to-back so the CSS marquee loop is seamless.
 * Children should be a flat sequence of inline-flex items (spans, links).
 */
export function Marquee({ children, duration = 28, className = "" }: MarqueeProps) {
  return (
    <div className={`fx-marquee ${className}`.trim()}>
      <div
        className="fx-marquee-track"
        style={{ animationDuration: `${duration}s` }}
        aria-hidden={false}
      >
        {children}
      </div>
      <div
        className="fx-marquee-track"
        style={{ animationDuration: `${duration}s` }}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}
