import { Glass } from "./glass";

interface PodiumEntry {
  pos: number;
  grid: number;
  delta: number;
  name: string;
  team: string;
  best: string;
  gap: string;
  picture?: string;
}

interface PodiumGroupProps {
  podium: [PodiumEntry, PodiumEntry, PodiumEntry];
}

export function PodiumGroup({ podium }: PodiumGroupProps) {
  return (
    <div className="podium-group">
      {podium.map((p, i) => {
        const isP1 = i === 0;
        return (
          <Glass
            key={i}
            cut={isP1 ? 18 : 14}
            pad={isP1 ? 22 : 18}
            stripe={isP1}
            data-primary-red={isP1}
            style={{
              background: isP1 ? "var(--bg-surface-p1)" : "var(--bg-surface)",
              opacity: i === 2 ? 0.92 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span
                className="mono"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: isP1 ? 46 : 34,
                  lineHeight: 1,
                  color: isP1 ? "var(--accent-red)" : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.01em",
                }}
              >
                P{p.pos}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color:
                    p.delta > 0
                      ? "var(--status-success)"
                      : p.delta < 0
                      ? "var(--status-danger)"
                      : "var(--text-tertiary)",
                }}
              >
                GRID {String(p.grid).padStart(2, "0")}{" "}
                {p.delta > 0 ? `▲${p.delta}` : p.delta < 0 ? `▼${Math.abs(p.delta)}` : "—"}
              </span>
            </div>

            <div className={!isP1 ? "podium-driver-sm" : undefined} style={{ marginTop: isP1 ? 18 : 14, ...(!isP1 ? {} : { display: "flex", alignItems: "center", gap: 12 }) }}>
              {p.picture && (
                <img
                  src={p.picture}
                  alt={p.name}
                  className={`fx-portrait ${!isP1 ? "podium-pic-sm" : ""}`.trim()}
                  style={{
                    width: isP1 ? 104 : undefined,
                    height: isP1 ? 104 : undefined,
                    objectFit: "cover",
                    border: "1px solid var(--border-hairline)",
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: isP1 ? 18 : 15,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>
                  {p.team}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: "0.5px dashed rgba(255,255,255,0.08)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <div className="label">BEST LAP</div>
                <div className="mono" style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 3 }}>
                  {p.best}
                </div>
              </div>
              <div>
                <div className="label">GAP</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 13,
                    color: isP1 ? "var(--accent-red)" : "var(--text-primary)",
                    marginTop: 3,
                  }}
                >
                  {p.gap}
                </div>
              </div>
            </div>
          </Glass>
        );
      })}
    </div>
  );
}
