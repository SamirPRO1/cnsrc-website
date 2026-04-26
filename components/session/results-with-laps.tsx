"use client";

import { useState, Fragment } from "react";
import type { Result, Lap } from "@/lib/types";
import {
  parseDriverLaps,
  analyzeDriverLaps,
  formatLapTime,
} from "@/lib/derive/lapAnalysis";

interface Props {
  results: Result[];
  laps: Lap[];
  driverNames: Record<string, string>;
  driverPictures: Record<string, string | undefined>;
  teamNames: Record<string, string>;
  isMultiClass: boolean;
}

const STATUS_LABEL: Record<Result["status"], string> = {
  finished: "TERMINADO",
  dnf: "ABANDONO",
  dsq: "DSQ",
  dnq: "DNQ",
};
const STATUS_COLOR: Record<Result["status"], string> = {
  finished: "var(--status-success)",
  dnf: "var(--status-danger)",
  dsq: "var(--status-danger)",
  dnq: "var(--text-tertiary)",
};

export default function ResultsWithLaps({
  results,
  laps,
  driverNames,
  driverPictures,
  teamNames,
  isMultiClass,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const lapsByDriver = new Map<string, Lap[]>();
  for (const l of laps) {
    const arr = lapsByDriver.get(l.driverId);
    if (arr) arr.push(l);
    else lapsByDriver.set(l.driverId, [l]);
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {["POS", "SALIDA", "PILOTO", "EQUIPO", "MEJOR VLT.", "DIFER.", "PTS", "ESTADO", ""].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: i === 4 || i === 5 || i === 6 ? "right" : i === 0 || i === 1 ? "center" : "left",
                  padding: "8px 12px",
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
          {results.map((r, i) => {
            const isLeader = i === 0;
            const driverLaps = lapsByDriver.get(r.driverId) ?? [];
            const isExpanded = expanded === r.driverId;
            const hasLaps = driverLaps.length > 0;
            const classBg = isMultiClass
              ? r.classId === "am"
                ? "rgba(34,197,94,0.09)"
                : "rgba(220,38,38,0.09)"
              : isLeader
              ? "var(--bg-surface-p1)"
              : "transparent";

            return (
              <Fragment key={r.driverId}>
                <tr
                  onClick={() => hasLaps && setExpanded(isExpanded ? null : r.driverId)}
                  style={{
                    background: classBg,
                    borderTop: isLeader ? "0.5px solid var(--border-accent)" : "none",
                    cursor: hasLaps ? "pointer" : "default",
                  }}
                >
                  <td style={cellStyle({ mono: true, accent: isLeader, align: "center" })}>{r.pos}</td>
                  <td style={cellStyle({ mono: true, align: "center" })}>{r.gridPos}</td>
                  <td style={cellStyle({})}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {driverPictures[r.driverId] && (
                        <img
                          src={driverPictures[r.driverId]}
                          alt=""
                          style={{ width: 28, height: 28, objectFit: "cover", border: "1px solid var(--border-hairline)", flexShrink: 0 }}
                        />
                      )}
                      <span>{driverNames[r.driverId] ?? r.driverId}</span>
                      {hasLaps && (
                        <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={cellStyle({})}>{teamNames[r.teamId] ?? r.teamId}</td>
                  <td style={cellStyle({ mono: true, align: "right" })}>{r.bestLap}</td>
                  <td style={cellStyle({ mono: true, align: "right" })}>{r.gap}</td>
                  <td style={cellStyle({ mono: true, accent: isLeader, align: "right" })}>{r.points}</td>
                  <td style={cellStyle({})}>
                    <span style={{ color: STATUS_COLOR[r.status], fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.18em" }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td style={cellStyle({})} />
                </tr>
                {isExpanded && hasLaps && (
                  <tr>
                    <td colSpan={9} style={{ padding: 0, background: "rgba(0,0,0,0.25)" }}>
                      <DriverLapPanel driverId={r.driverId} laps={driverLaps} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {results.length === 0 && (
            <tr>
              <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function cellStyle({
  mono,
  accent,
  align,
}: {
  mono?: boolean;
  accent?: boolean;
  align?: "left" | "center" | "right";
}): React.CSSProperties {
  return {
    padding: "10px 12px",
    textAlign: align ?? "left",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
    fontVariantNumeric: mono ? "tabular-nums" : "normal",
    fontSize: mono ? 14 : 15,
    color: accent ? "var(--accent-red)" : "var(--text-primary)",
    borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
  };
}

/* ── Per-driver lap dropdown panel ───────────────────────────── */

function DriverLapPanel({ driverId, laps }: { driverId: string; laps: Lap[] }) {
  const parsed = parseDriverLaps(laps);
  const stats = analyzeDriverLaps(driverId, laps);
  const fastestNo = stats.fastestLapNo;

  return (
    <div style={{ padding: "16px 20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {["VLT", "TIEMPO", "S1", "S2", "S3", "NEUMÁTICO"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "6px 10px",
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  fontWeight: 400,
                  borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsed.map((l) => {
            const isFastest = l.lapNo === fastestNo;
            const isInvalid = !l.valid;
            return (
              <tr key={l.lapNo}>
                <td style={lapCell({ mono: true })}>{l.lapNo}</td>
                <td style={lapCell({ mono: true, color: isInvalid ? "var(--text-tertiary)" : isFastest ? "var(--accent-red)" : "var(--text-primary)" })}>
                  {formatLapTime(l.timeMs)} {l.cut && <span style={{ fontSize: 10, color: "var(--status-warning)" }}>· CUT</span>}
                </td>
                <td style={lapCell({ mono: true, color: stats.bestSectorsMs[0] === l.sectorsMs[0] ? "var(--status-success)" : "var(--text-secondary)" })}>
                  {formatLapTime(l.sectorsMs[0])}
                </td>
                <td style={lapCell({ mono: true, color: stats.bestSectorsMs[1] === l.sectorsMs[1] ? "var(--status-success)" : "var(--text-secondary)" })}>
                  {formatLapTime(l.sectorsMs[1])}
                </td>
                <td style={lapCell({ mono: true, color: stats.bestSectorsMs[2] === l.sectorsMs[2] ? "var(--status-success)" : "var(--text-secondary)" })}>
                  {formatLapTime(l.sectorsMs[2])}
                </td>
                <td style={lapCell({})}>{l.compound}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary footer */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "0.5px dashed rgba(255,255,255,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 16,
        }}
      >
        <FooterStat label="Vueltas válidas" value={`${stats.validLaps}/${stats.totalLaps}`} />
        <FooterStat label="Promedio" value={formatLapTime(stats.averageValidLapMs ?? NaN)} />
        <FooterStat label="Más rápida" value={formatLapTime(stats.fastestLapMs ?? NaN)} accent />
        <FooterStat label="Mejor teórica" value={formatLapTime(stats.theoreticalBestMs ?? NaN)} success />
      </div>
    </div>
  );
}

function lapCell({
  mono,
  color,
}: {
  mono?: boolean;
  color?: string;
}): React.CSSProperties {
  return {
    padding: "5px 10px",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
    fontSize: 12,
    fontVariantNumeric: mono ? "tabular-nums" : "normal",
    color: color ?? "var(--text-primary)",
    borderBottom: "0.5px dashed rgba(255,255,255,0.05)",
  };
}

function FooterStat({
  label,
  value,
  accent,
  success,
}: {
  label: string;
  value: string;
  accent?: boolean;
  success?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="label" style={{ fontSize: 10 }}>{label}</span>
      <span
        className="mono"
        style={{
          fontSize: 16,
          color: accent ? "var(--accent-red)" : success ? "var(--status-success)" : "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
