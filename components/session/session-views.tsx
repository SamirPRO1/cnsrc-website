"use client";

import { useState } from "react";
import type { Result, Lap } from "@/lib/types";
import ResultsWithLaps from "./results-with-laps";
import ConsistencyView from "./consistency-view";
import RacePositionsChart from "./race-positions-chart";

type View = "results" | "consistency" | "positions";

const TABS: { key: View; label: string }[] = [
  { key: "results", label: "Resultados" },
  { key: "consistency", label: "Consistencia" },
  { key: "positions", label: "Posiciones" },
];

interface Props {
  results: Result[];
  laps: Lap[];
  driverNames: Record<string, string>;
  driverPictures: Record<string, string | undefined>;
  teamNames: Record<string, string>;
  isMultiClass: boolean;
}

export default function SessionViews(props: Props) {
  const [view, setView] = useState<View>("results");

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 12,
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        {TABS.map((t) => {
          const active = view === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 18px",
                fontFamily: "var(--font-display)",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: active ? "var(--accent-red)" : "var(--text-secondary)",
                cursor: "pointer",
                borderBottom: active
                  ? "2px solid var(--accent-red)"
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {view === "results" && <ResultsWithLaps {...props} />}
      {view === "consistency" && (
        <ConsistencyView
          results={props.results}
          laps={props.laps}
          driverNames={props.driverNames}
          driverPictures={props.driverPictures}
          teamNames={props.teamNames}
        />
      )}
      {view === "positions" && (
        <RacePositionsChart
          results={props.results}
          laps={props.laps}
          driverNames={props.driverNames}
        />
      )}
    </div>
  );
}
