"use client";

import { useState } from "react";
import Link from "next/link";
import type { DriverProfileRaceResult } from "@/lib/types";

interface SeasonRow {
  championshipId: string;
  season: string;
  pos: number;
  pts: number;
  wins: number;
  podiums: number;
  races: DriverProfileRaceResult[];
}

export function SeasonsTable({ seasons }: { seasons: SeasonRow[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["TEMPORADA", "POSICIÓN", "PUNTOS", "VICTORIAS", "PODIOS", ""].map((h) => (
            <th
              key={h}
              style={{
                padding: "8px 14px",
                textAlign: "left",
                fontFamily: "var(--font-display)",
                fontSize: 11,
                letterSpacing: "0.2em",
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
        {seasons.map((s) => {
          const isOpen = open === s.championshipId;
          return (
            <>
              <tr
                key={s.championshipId}
                style={{ background: s.pos === 1 ? "var(--bg-surface-p1)" : "transparent" }}
              >
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text-primary)" }}>
                  {s.season}
                </td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 14, color: s.pos === 1 ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  P{s.pos}
                </td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {s.pts}
                </td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {s.wins}
                </td>
                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {s.podiums}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  {s.races.length > 0 && (
                    <button
                      onClick={() => setOpen(isOpen ? null : s.championshipId)}
                      style={{
                        background: "none",
                        border: "0.5px solid rgba(255,255,255,0.15)",
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-display)",
                        fontSize: 10,
                        letterSpacing: "0.15em",
                        padding: "3px 8px",
                        cursor: "pointer",
                        transition: "color 0.15s",
                      }}
                    >
                      {isOpen ? "▲ OCULTAR" : "▼ CARRERAS"}
                    </button>
                  )}
                </td>
              </tr>
              {isOpen && (
                <tr key={`${s.championshipId}-races`}>
                  <td
                    colSpan={6}
                    style={{
                      padding: "0 14px 10px 28px",
                      borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["RDA", "CIRCUITO", "SESIÓN", "POS", "PTS", "ESTADO"].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "5px 10px",
                                textAlign: "left",
                                fontFamily: "var(--font-display)",
                                fontSize: 10,
                                letterSpacing: "0.2em",
                                color: "var(--text-tertiary)",
                                fontWeight: 400,
                                borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.races.map((r) => (
                          <tr key={r.sessionId}>
                            <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                              {r.roundIndex}
                            </td>
                            <td style={{ padding: "6px 10px", fontFamily: "var(--font-display)", fontSize: 12, color: "var(--text-secondary)" }}>
                              {r.trackName}
                            </td>
                            <td style={{ padding: "6px 10px", fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.1em", color: "var(--text-tertiary)" }}>
                              {r.label.toUpperCase()}
                            </td>
                            <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 13, color: r.pos === 1 ? "var(--accent-red)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums", fontWeight: r.pos !== null && r.pos <= 3 ? 700 : 400 }}>
                              {r.pos !== null ? `P${r.pos}` : "—"}
                            </td>
                            <td style={{ padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                              {r.pts}
                            </td>
                            <td style={{ padding: "6px 10px" }}>
                              <Link
                                href={`/sessions/${r.sessionId}`}
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: 10,
                                  letterSpacing: "0.15em",
                                  color: r.status === "finished" ? "var(--text-tertiary)" : "var(--status-warning)",
                                  textDecoration: "none",
                                }}
                              >
                                {r.status === "finished" ? "VER →" : r.status.toUpperCase()}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}
