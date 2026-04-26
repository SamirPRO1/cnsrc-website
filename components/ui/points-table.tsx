import type { PointsTable } from "@/lib/types";

interface PointsTableProps {
  table: PointsTable;
}

export function PointsTableDisplay({ table }: PointsTableProps) {
  const r2 = table.r1.map((_, i) => table.r2[i] ?? 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {["POS", "CARRERA 1", "CARRERA 2 (×1.5)"].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: i === 0 ? "center" : "right",
                  padding: "8px 16px",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  fontWeight: 400,
                  borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.r1.map((pts, i) => {
            const isP1 = i === 0;
            return (
              <tr
                key={i}
                style={{
                  background: isP1 ? "var(--bg-surface-p1)" : "transparent",
                  borderTop: isP1 ? "0.5px solid var(--border-accent)" : "none",
                }}
              >
                <td
                  style={{
                    padding: "9px 16px",
                    textAlign: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 13,
                    color: isP1 ? "var(--accent-red)" : "var(--text-secondary)",
                    borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  P{i + 1}
                </td>
                <td
                  style={{
                    padding: "9px 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    color: pts > 0 ? (isP1 ? "var(--accent-red)" : "var(--text-primary)") : "var(--text-tertiary)",
                    borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {pts}
                </td>
                <td
                  style={{
                    padding: "9px 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    color: r2[i] > 0 ? (isP1 ? "var(--accent-red)" : "var(--text-primary)") : "var(--text-tertiary)",
                    borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r2[i]}
                </td>
              </tr>
            );
          })}
          <tr>
            <td
              style={{
                padding: "9px 16px",
                textAlign: "center",
                fontFamily: "var(--font-display)",
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "var(--text-tertiary)",
                borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
              }}
            >
              FL
            </td>
            <td
              style={{
                padding: "9px 16px",
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--text-secondary)",
                borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              +{table.fastestLapR1}
            </td>
            <td
              style={{
                padding: "9px 16px",
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--text-secondary)",
                borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              +{table.fastestLapR2}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
