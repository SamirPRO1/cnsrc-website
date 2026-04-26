"use client";

import { useState } from "react";
import type { PointsTable } from "@/lib/types";
import AdminButton from "./admin-button";
import AdminFormField, { INPUT_STYLE } from "./admin-form-field";

interface Props {
  initial?: PointsTable;
  onSave: (table: PointsTable) => void;
  saving?: boolean;
}

const DEFAULT_TABLE: PointsTable = {
  r1: [25, 18, 15, 12, 10, 8, 6, 4],
  r2: [37.5, 27, 22.5, 18, 15, 12, 9],
  fastestLapR1: 1,
  fastestLapR2: 1.5,
};

export default function PointsTableEditor({ initial, onSave, saving }: Props) {
  const [r1, setR1] = useState<number[]>(initial?.r1 ?? DEFAULT_TABLE.r1);
  const [r2, setR2] = useState<number[]>(initial?.r2 ?? DEFAULT_TABLE.r2);
  const [flR1, setFlR1] = useState(initial?.fastestLapR1 ?? DEFAULT_TABLE.fastestLapR1);
  const [flR2, setFlR2] = useState(initial?.fastestLapR2 ?? DEFAULT_TABLE.fastestLapR2);

  const updateR1 = (i: number, v: number) =>
    setR1((prev) => prev.map((x, j) => (j === i ? v : x)));
  const updateR2 = (i: number, v: number) =>
    setR2((prev) => prev.map((x, j) => (j === i ? v : x)));

  const handleSave = () => {
    onSave({ r1, r2, fastestLapR1: flR1, fastestLapR2: flR2 });
  };

  const maxRows = Math.max(r1.length, r2.length);

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
        <thead>
          <tr>
            {["POS", "CARRERA 1", "CARRERA 2", ""].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: i === 0 ? "center" : i === 3 ? "center" : "right",
                  padding: "6px 12px",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
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
          {Array.from({ length: maxRows }, (_, i) => (
            <tr key={i}>
              <td
                style={{
                  padding: "5px 12px",
                  textAlign: "center",
                  fontFamily: "var(--font-display)",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  width: 60,
                }}
              >
                P{i + 1}
              </td>
              <td style={{ padding: "5px 12px", width: "40%" }}>
                {i < r1.length ? (
                  <input
                    type="number"
                    step="0.5"
                    style={{ ...INPUT_STYLE, padding: "4px 8px", fontSize: 13, fontFamily: "var(--font-mono)", textAlign: "right" }}
                    value={r1[i]}
                    onChange={(e) => updateR1(i, parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span>
                )}
              </td>
              <td style={{ padding: "5px 12px", width: "40%" }}>
                {i < r2.length ? (
                  <input
                    type="number"
                    step="0.5"
                    style={{ ...INPUT_STYLE, padding: "4px 8px", fontSize: 13, fontFamily: "var(--font-mono)", textAlign: "right" }}
                    value={r2[i]}
                    onChange={(e) => updateR2(i, parseFloat(e.target.value) || 0)}
                  />
                ) : (
                  <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span>
                )}
              </td>
              <td style={{ padding: "5px 4px", width: 40, textAlign: "center" }}>
                {(i === r1.length - 1 && r1.length > 1) || (i === r2.length - 1 && r2.length > 1) ? (
                  <button
                    onClick={() => {
                      if (i === r1.length - 1 && r1.length > 1) setR1((prev) => prev.slice(0, -1));
                      if (i === r2.length - 1 && r2.length > 1) setR2((prev) => prev.slice(0, -1));
                    }}
                    title="Quitar última fila"
                    style={{
                      background: "none", border: "none",
                      color: "var(--status-danger)", cursor: "pointer", fontSize: 14,
                    }}
                  >
                    &times;
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <AdminButton
                  variant="secondary"
                  onClick={() => setR1((prev) => [...prev, 0])}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  + Fila C1
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  onClick={() => setR2((prev) => [...prev, 0])}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  + Fila C2
                </AdminButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AdminFormField label="Bonus vuelta rápida (C1)">
          <input
            type="number"
            step="0.5"
            style={{ ...INPUT_STYLE, fontFamily: "var(--font-mono)", textAlign: "right" }}
            value={flR1}
            onChange={(e) => setFlR1(parseFloat(e.target.value) || 0)}
          />
        </AdminFormField>
        <AdminFormField label="Bonus vuelta rápida (C2)">
          <input
            type="number"
            step="0.5"
            style={{ ...INPUT_STYLE, fontFamily: "var(--font-mono)", textAlign: "right" }}
            value={flR2}
            onChange={(e) => setFlR2(parseFloat(e.target.value) || 0)}
          />
        </AdminFormField>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar tabla de puntos"}
        </AdminButton>
      </div>
    </div>
  );
}
