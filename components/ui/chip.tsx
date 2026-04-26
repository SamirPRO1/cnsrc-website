import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  tone?: "default" | "live";
}

export function Chip({ children, tone = "default" }: ChipProps) {
  return (
    <span className={tone === "live" ? "chip chip--live" : "chip"}>
      {tone === "live" && (
        <span
          aria-hidden="true"
          className="pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent-red)",
            boxShadow: "0 0 0 3px rgba(228,23,61,0.18)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

export function LiveChip({ round = "04" }: { round?: string }) {
  return <Chip tone="live">LIVE · RND {round.padStart(2, "0")}</Chip>;
}
