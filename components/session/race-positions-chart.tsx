"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Result, Lap } from "@/lib/types";
import { computeRacePositions } from "@/lib/derive/lapAnalysis";

interface Props {
  results: Result[];
  laps: Lap[];
  driverNames: Record<string, string>;
}

/* Stable color palette — cycles for >12 drivers */
const PALETTE = [
  "#E4173D", "#22C55E", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899",
  "#10B981", "#F97316", "#6366F1", "#14B8A6", "#EAB308", "#A855F7",
  "#3B82F6", "#EF4444", "#84CC16", "#0EA5E9",
];

export default function RacePositionsChart({ results, laps, driverNames }: Props) {
  const series = useMemo(() => computeRacePositions(results, laps), [results, laps]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  if (series.length === 0 || laps.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        No hay datos de vueltas para graficar posiciones.
      </div>
    );
  }

  const maxLap = Math.max(...laps.map((l) => l.lapNo));
  const numDrivers = results.length;

  // Build chart data: rows of { lap, [driverId]: pos }
  const data: Array<Record<string, number | null>> = [];
  // Lap 0 = grid
  const gridRow: Record<string, number | null> = { lap: 0 };
  for (const s of series) gridRow[s.driverId] = s.startGrid;
  data.push(gridRow);

  for (let lap = 1; lap <= maxLap; lap++) {
    const row: Record<string, number | null> = { lap };
    for (const s of series) {
      const pt = s.points.find((p) => p.lap === lap);
      row[s.driverId] = pt?.pos ?? null;
    }
    data.push(row);
  }

  const driverColor = (id: string) =>
    PALETTE[results.findIndex((r) => r.driverId === id) % PALETTE.length];

  const toggle = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ width: "100%", height: 480 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <XAxis
              dataKey="lap"
              type="number"
              domain={[0, maxLap]}
              tick={{ fill: "#71717A", fontSize: 11, fontFamily: "JetBrains Mono" }}
              label={{
                value: "VUELTA",
                position: "insideBottom",
                offset: -10,
                style: { fill: "#71717A", fontSize: 11, letterSpacing: "0.18em" },
              }}
              tickLine={{ stroke: "#27272A" }}
              axisLine={{ stroke: "#27272A" }}
            />
            <YAxis
              type="number"
              domain={[1, numDrivers]}
              reversed
              ticks={Array.from({ length: numDrivers }, (_, i) => i + 1)}
              tick={{ fill: "#71717A", fontSize: 11, fontFamily: "JetBrains Mono" }}
              label={{
                value: "POSICIÓN",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#71717A", fontSize: 11, letterSpacing: "0.18em", textAnchor: "middle" },
              }}
              tickLine={{ stroke: "#27272A" }}
              axisLine={{ stroke: "#27272A" }}
            />
            <Tooltip
              contentStyle={{
                background: "#18181B",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 12,
                fontFamily: "Inter",
              }}
              labelStyle={{ color: "#FAFAFA", fontFamily: "Oswald", letterSpacing: "0.1em", textTransform: "uppercase" }}
              labelFormatter={(label) => `Vuelta ${label}`}
              formatter={(value, name) => [
                typeof value === "number" ? `P${value}` : "—",
                driverNames[String(name)] ?? String(name),
              ]}
              itemSorter={(item) => (typeof item.value === "number" ? item.value : 999)}
            />
            {series.map((s) => (
              <Line
                key={s.driverId}
                type="monotone"
                dataKey={s.driverId}
                stroke={driverColor(s.driverId)}
                strokeWidth={hidden.has(s.driverId) ? 0 : 2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with toggle */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 6,
        }}
      >
        {results.map((r) => {
          const isHidden = hidden.has(r.driverId);
          return (
            <button
              key={r.driverId}
              onClick={() => toggle(r.driverId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-hairline)",
                cursor: "pointer",
                opacity: isHidden ? 0.4 : 1,
                fontSize: 12,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 3,
                  background: driverColor(r.driverId),
                  flexShrink: 0,
                }}
              />
              <span className="mono" style={{ fontSize: 11, color: "var(--text-tertiary)", width: 22 }}>
                P{r.pos}
              </span>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {driverNames[r.driverId] ?? r.driverId}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
