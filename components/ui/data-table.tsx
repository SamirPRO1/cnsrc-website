/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Column<T = any> {
  key: keyof T & string;
  label: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  mono?: boolean;
  accentIfLeader?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  rows: T[];
  leaderRowIndex?: number;
  rowBg?: (row: T, index: number) => string | undefined;
}

export function DataTable<T>({ columns, rows, leaderRowIndex = 0, rowBg }: DataTableProps<T>) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                style={{
                  textAlign: c.align ?? "left",
                  padding: "8px 12px",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  fontWeight: 400,
                  borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                  width: c.width,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isLeader = leaderRowIndex >= 0 && i === leaderRowIndex;
            const customBg = rowBg?.(row, i);
            const bg = customBg ?? (isLeader ? "var(--bg-surface-p1)" : "transparent");
            return (
              <tr
                key={i}
                style={{
                  background: bg,
                  borderTop: isLeader ? "0.5px solid var(--border-accent)" : "none",
                }}
              >
                {columns.map((c, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "10px 12px",
                      textAlign: c.align ?? "left",
                      fontFamily: c.mono ? "var(--font-mono)" : "var(--font-body)",
                      fontVariantNumeric: c.mono ? "tabular-nums" : "normal",
                      fontFeatureSettings: c.mono ? '"tnum" 1' : "normal",
                      fontSize: c.mono ? 14 : 15,
                      color:
                        c.accentIfLeader && isLeader
                          ? "var(--accent-red)"
                          : "var(--text-primary)",
                      borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
                    }}
                  >
                    {c.render ? c.render(row, i) : String((row as any)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
