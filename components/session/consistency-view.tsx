"use client";

import type { Result, Lap } from "@/lib/types";
import {
  analyzeDriverLaps,
  formatLapTime,
} from "@/lib/derive/lapAnalysis";

interface Props {
  results: Result[];
  laps: Lap[];
  driverNames: Record<string, string>;
  driverPictures: Record<string, string | undefined>;
  teamNames: Record<string, string>;
}

export default function ConsistencyView({
  results,
  laps,
  driverNames,
  driverPictures,
  teamNames,
}: Props) {
  const lapsByDriver = new Map<string, Lap[]>();
  for (const l of laps) {
    const arr = lapsByDriver.get(l.driverId);
    if (arr) arr.push(l);
    else lapsByDriver.set(l.driverId, [l]);
  }

  const allRows = results.map((r) => {
    const stats = analyzeDriverLaps(r.driverId, lapsByDriver.get(r.driverId) ?? []);
    return { result: r, stats };
  });

  const maxTotalLaps = Math.max(0, ...allRows.map((r) => r.stats.totalLaps));
  const lapThreshold = maxTotalLaps * 0.75;

  const rows = allRows
    .filter((row) => row.stats.validLaps > 0 && row.stats.totalLaps >= lapThreshold)
    .sort((a, b) => (b.stats.consistencyPct ?? 0) - (a.stats.consistencyPct ?? 0));

  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        No hay datos de vueltas para analizar consistencia.
      </div>
    );
  }

  // For the bar fill scale, use the worst row's consistency as the lower bound
  const minPct = Math.min(...rows.map((r) => r.stats.consistencyPct ?? 100));
  const range = Math.max(0.5, 100 - minPct);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {[
              { l: "#", w: 40, c: true },
              { l: "PILOTO", w: undefined, c: false },
              { l: "EQUIPO", w: undefined, c: false },
              { l: "VLT.", w: 60, c: true },
              { l: "MÁS RÁPIDA", w: 110, c: false, r: true },
              { l: "MÁS LENTA", w: 110, c: false, r: true },
              { l: "DELTA", w: 90, c: false, r: true },
              { l: "CONSISTENCIA", w: 220, c: false, r: false },
            ].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: h.c ? "center" : h.r ? "right" : "left",
                  padding: "8px 12px",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  fontWeight: 400,
                  borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                  width: h.w,
                }}
              >
                {h.l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pct = row.stats.consistencyPct ?? 0;
            const fill = ((pct - minPct) / range) * 100;
            const isLeader = i === 0;
            return (
              <tr
                key={row.result.driverId}
                style={{
                  background: isLeader ? "var(--bg-surface-p1)" : "transparent",
                  borderTop: isLeader ? "0.5px solid var(--border-accent)" : "none",
                }}
              >
                <td style={cell({ mono: true, align: "center", accent: isLeader })}>{i + 1}</td>
                <td style={cell({})}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {driverPictures[row.result.driverId] && (
                      <img
                        src={driverPictures[row.result.driverId]}
                        alt=""
                        style={{
                          width: 28,
                          height: 28,
                          objectFit: "cover",
                          border: "1px solid var(--border-hairline)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span>{driverNames[row.result.driverId] ?? row.result.driverId}</span>
                  </div>
                </td>
                <td style={cell({})}>{teamNames[row.result.teamId] ?? row.result.teamId}</td>
                <td style={cell({ mono: true, align: "center" })}>{row.stats.validLaps}</td>
                <td style={cell({ mono: true, align: "right", color: "var(--accent-red)" })}>
                  {formatLapTime(row.stats.fastestLapMs ?? NaN)}
                </td>
                <td style={cell({ mono: true, align: "right" })}>
                  {formatLapTime(row.stats.slowestValidLapMs ?? NaN)}
                </td>
                <td style={cell({ mono: true, align: "right", color: "var(--status-warning)" })}>
                  {row.stats.spreadMs !== null ? `+${formatLapTime(row.stats.spreadMs)}` : "—"}
                </td>
                <td style={cell({})}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: "var(--bg-surface)",
                        position: "relative",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: `${Math.max(2, fill)}%`,
                          background: isLeader
                            ? "var(--accent-red)"
                            : pct > 99
                            ? "var(--status-success)"
                            : "var(--text-secondary)",
                        }}
                      />
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: 14,
                        color: isLeader ? "var(--accent-red)" : "var(--text-primary)",
                        minWidth: 64,
                        textAlign: "right",
                      }}
                    >
                      {pct.toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
        style={{
          padding: "12px 16px",
          fontSize: 11,
          color: "var(--text-tertiary)",
          borderTop: "0.5px dashed rgba(255,255,255,0.08)",
        }}
      >
        Consistencia = (vuelta más rápida / promedio de vueltas válidas) × 100. Excluye vuelta 1 y pilotos con menos del 75 % de vueltas completadas respecto al líder.
      </div>
    </div>
  );
}

function cell({
  mono,
  align,
  accent,
  color,
}: {
  mono?: boolean;
  align?: "left" | "center" | "right";
  accent?: boolean;
  color?: string;
}): React.CSSProperties {
  return {
    padding: "10px 12px",
    textAlign: align ?? "left",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
    fontVariantNumeric: mono ? "tabular-nums" : "normal",
    fontSize: mono ? 14 : 14,
    color: color ?? (accent ? "var(--accent-red)" : "var(--text-primary)"),
    borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
  };
}
