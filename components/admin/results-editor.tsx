"use client";

import { useState } from "react";
import type { Result, Driver, Team, PointsTable } from "@/lib/types";
import { INPUT_STYLE, SELECT_STYLE } from "./admin-form-field";
import AdminButton from "./admin-button";

interface Props {
  results: Result[];
  drivers: Driver[];
  teams: Team[];
  classes: { id: string; label: string }[];
  onChange: (results: Result[]) => void;
  pointsTable?: PointsTable;
  isRace2?: boolean;
}

const EMPTY_RESULT: Result = {
  pos: 0,
  gridPos: 0,
  driverId: "",
  teamId: "",
  classId: "",
  bestLap: "",
  gap: "—",
  points: 0,
  status: "finished",
};

function parseGapMs(gap: string): number | null {
  if (gap === "—") return 0;
  const withMin = gap.match(/^\+(\d+):(\d+\.\d+)$/);
  if (withMin) return (parseInt(withMin[1]) * 60 + parseFloat(withMin[2])) * 1000;
  const secOnly = gap.match(/^\+(\d+\.\d+)$/);
  if (secOnly) return parseFloat(secOnly[1]) * 1000;
  return null;
}

function formatGapMs(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 60_000) return `+${(ms / 1000).toFixed(3)}`;
  const mins = Math.floor(ms / 60_000);
  const sec = (ms - mins * 60_000) / 1000;
  return `+${mins}:${sec.toFixed(3).padStart(6, "0")}`;
}

export default function ResultsEditor({
  results,
  drivers,
  teams,
  classes,
  onChange,
  pointsTable,
  isRace2 = false,
}: Props) {
  const [rows, setRows] = useState<Result[]>(results);
  const [penalties, setPenalties] = useState<Record<string, number>>({});

  const update = (idx: number, patch: Partial<Result>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setRows(next);
    onChange(next);
  };

  const addRow = () => {
    const next = [
      ...rows,
      { ...EMPTY_RESULT, pos: rows.length + 1, gridPos: rows.length + 1 },
    ];
    setRows(next);
    onChange(next);
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    onChange(next);
  };

  const driverName = (id: string) =>
    drivers.find((d) => d.id === id)?.name ?? id;

  const applyPenalties = () => {
    if (!pointsTable) return;

    const table = isRace2 ? pointsTable.r2 : pointsTable.r1;
    const flBonus = isRace2 ? pointsTable.fastestLapR2 : pointsTable.fastestLapR1;

    // Process each class independently
    const byClass = new Map<string, Result[]>();
    for (const r of rows) {
      const arr = byClass.get(r.classId) ?? [];
      arr.push(r);
      byClass.set(r.classId, arr);
    }

    const newRows: Result[] = [];

    for (const classRows of byClass.values()) {
      // Detect the fastest-lap holder from stored points before reorder
      let flDriverId: string | null = null;
      for (const r of classRows) {
        if (r.status === "finished" && r.driverId) {
          const base = table[r.pos - 1] ?? 0;
          if (r.points > base) {
            flDriverId = r.driverId;
            break;
          }
        }
      }

      const finished = classRows.filter((r) => r.status === "finished");
      const others = classRows.filter((r) => r.status !== "finished");

      // Apply penalty and sort
      const parsed = finished.map((r) => {
        const baseMs = parseGapMs(r.gap) ?? Number.MAX_SAFE_INTEGER;
        const penaltyMs = (penalties[r.driverId] ?? 0) * 1000;
        return { result: r, adjustedMs: baseMs + penaltyMs };
      });
      parsed.sort((a, b) => a.adjustedMs - b.adjustedMs);

      const winnerMs = parsed[0]?.adjustedMs ?? 0;

      const newFinished: Result[] = parsed.map(({ result, adjustedMs }, i) => {
        const pos = i + 1;
        const gap = i === 0 ? "—" : formatGapMs(adjustedMs - winnerMs);
        const base = table[pos - 1] ?? 0;
        const points = base + (result.driverId === flDriverId ? flBonus : 0);
        return { ...result, pos, gap, points };
      });

      const newOthers: Result[] = others.map((r, i) => ({
        ...r,
        pos: newFinished.length + i + 1,
        points: 0,
      }));

      newRows.push(...newFinished, ...newOthers);
    }

    setRows(newRows);
    onChange(newRows);
    setPenalties({});
  };

  const penalizableRows = rows.filter((r) => r.status === "finished" && r.driverId);
  const hasPenalties = Object.values(penalties).some((v) => v > 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
          fontFamily: "var(--font-body)",
        }}
      >
        <thead>
          <tr>
            {["Pos", "Grid", "Piloto", "Equipo", "Clase", "Mejor Vuelta", "Gap", "Pts", "Estado", ""].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "6px 4px",
                    borderBottom: "1px solid var(--border-hairline)",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    fontWeight: 400,
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border-hairline)" }}>
              <td style={{ padding: "4px 2px", width: 50 }}>
                <input
                  style={{ ...INPUT_STYLE, width: 45, padding: "4px 6px", fontSize: 12 }}
                  type="number"
                  value={r.pos}
                  onChange={(e) => update(i, { pos: +e.target.value })}
                />
              </td>
              <td style={{ padding: "4px 2px", width: 50 }}>
                <input
                  style={{ ...INPUT_STYLE, width: 45, padding: "4px 6px", fontSize: 12 }}
                  type="number"
                  value={r.gridPos}
                  onChange={(e) => update(i, { gridPos: +e.target.value })}
                />
              </td>
              <td style={{ padding: "4px 2px" }}>
                <select
                  style={{ ...SELECT_STYLE, padding: "4px 6px", fontSize: 12 }}
                  value={r.driverId}
                  onChange={(e) => {
                    const d = drivers.find((d) => d.id === e.target.value);
                    update(i, {
                      driverId: e.target.value,
                      teamId: d?.teamId ?? r.teamId,
                    });
                  }}
                >
                  <option value="">—</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.number} {d.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "4px 2px" }}>
                <select
                  style={{ ...SELECT_STYLE, padding: "4px 6px", fontSize: 12 }}
                  value={r.teamId}
                  onChange={(e) => update(i, { teamId: e.target.value })}
                >
                  <option value="">—</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "4px 2px", width: 100 }}>
                <select
                  style={{ ...SELECT_STYLE, padding: "4px 6px", fontSize: 12 }}
                  value={r.classId}
                  onChange={(e) => update(i, { classId: e.target.value })}
                >
                  <option value="">—</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "4px 2px", width: 110 }}>
                <input
                  style={{ ...INPUT_STYLE, width: 100, padding: "4px 6px", fontSize: 12, fontFamily: "var(--font-mono)" }}
                  value={r.bestLap}
                  onChange={(e) => update(i, { bestLap: e.target.value })}
                  placeholder="1:23.456"
                />
              </td>
              <td style={{ padding: "4px 2px", width: 90 }}>
                <input
                  style={{ ...INPUT_STYLE, width: 80, padding: "4px 6px", fontSize: 12, fontFamily: "var(--font-mono)" }}
                  value={r.gap}
                  onChange={(e) => update(i, { gap: e.target.value })}
                  placeholder="+1.234"
                />
              </td>
              <td style={{ padding: "4px 2px", width: 55 }}>
                <input
                  style={{ ...INPUT_STYLE, width: 50, padding: "4px 6px", fontSize: 12 }}
                  type="number"
                  value={r.points}
                  onChange={(e) => update(i, { points: +e.target.value })}
                />
              </td>
              <td style={{ padding: "4px 2px", width: 100 }}>
                <select
                  style={{ ...SELECT_STYLE, padding: "4px 6px", fontSize: 12 }}
                  value={r.status}
                  onChange={(e) =>
                    update(i, { status: e.target.value as Result["status"] })
                  }
                >
                  <option value="finished">Finished</option>
                  <option value="dnf">DNF</option>
                  <option value="dsq">DSQ</option>
                  <option value="dnq">DNQ</option>
                </select>
              </td>
              <td style={{ padding: "4px 2px" }}>
                <button
                  onClick={() => removeRow(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--status-danger)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8 }}>
        <AdminButton variant="secondary" onClick={addRow} style={{ fontSize: 11, padding: "4px 12px" }}>
          + Resultado
        </AdminButton>
      </div>

      {pointsTable && penalizableRows.length > 0 && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--border-hairline)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: 10,
              color: "var(--text-tertiary)",
              margin: "0 0 10px",
            }}
          >
            Penalizaciones de tiempo
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 12 }}>
            {penalizableRows.map((r) => (
              <div
                key={r.driverId}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span style={{ fontSize: 12, minWidth: 130 }}>{driverName(r.driverId)}</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={penalties[r.driverId] ?? 0}
                  onChange={(e) =>
                    setPenalties((prev) => ({ ...prev, [r.driverId]: +e.target.value }))
                  }
                  style={{ ...INPUT_STYLE, width: 64, padding: "4px 6px", fontSize: 12 }}
                />
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>s</span>
              </div>
            ))}
          </div>
          <AdminButton
            onClick={applyPenalties}
            disabled={!hasPenalties}
            style={{ fontSize: 11, padding: "6px 14px" }}
          >
            Aplicar penalizaciones
          </AdminButton>
        </div>
      )}
    </div>
  );
}
