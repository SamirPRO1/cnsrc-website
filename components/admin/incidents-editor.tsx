"use client";

import { useState } from "react";
import type { Incident, Driver } from "@/lib/types";
import { INPUT_STYLE, SELECT_STYLE } from "./admin-form-field";
import AdminButton from "./admin-button";

interface Props {
  incidents: Incident[];
  drivers: Driver[];
  onChange: (incidents: Incident[]) => void;
}

const EMPTY: Incident = { lap: 0, kind: "collision", driverIds: [], summary: "" };

export default function IncidentsEditor({ incidents, drivers, onChange }: Props) {
  const [rows, setRows] = useState<Incident[]>(incidents);

  const update = (idx: number, patch: Partial<Incident>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setRows(next);
    onChange(next);
  };

  const addRow = () => {
    const next = [...rows, { ...EMPTY }];
    setRows(next);
    onChange(next);
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    onChange(next);
  };

  return (
    <div>
      {rows.map((inc, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "60px 120px 1fr 1fr auto",
            gap: 8,
            padding: "8px 0",
            borderBottom: "1px solid var(--border-hairline)",
            alignItems: "center",
          }}
        >
          <input
            style={{ ...INPUT_STYLE, padding: "4px 6px", fontSize: 12 }}
            type="number"
            value={inc.lap}
            onChange={(e) => update(i, { lap: +e.target.value })}
            placeholder="Lap"
          />
          <select
            style={{ ...SELECT_STYLE, padding: "4px 6px", fontSize: 12 }}
            value={inc.kind}
            onChange={(e) => update(i, { kind: e.target.value as Incident["kind"] })}
          >
            <option value="collision">Colision</option>
            <option value="offtrack">Fuera de pista</option>
            <option value="drivethrough">Drive-through</option>
          </select>
          <input
            style={{ ...INPUT_STYLE, padding: "4px 6px", fontSize: 12 }}
            value={inc.summary}
            onChange={(e) => update(i, { summary: e.target.value })}
            placeholder="Descripcion del incidente"
          />
          <select
            multiple
            style={{ ...SELECT_STYLE, padding: "4px 6px", fontSize: 11, minHeight: 50 }}
            value={inc.driverIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value);
              update(i, { driverIds: selected });
            }}
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.number} {d.name}
              </option>
            ))}
          </select>
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
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <AdminButton variant="secondary" onClick={addRow} style={{ fontSize: 11, padding: "4px 12px" }}>
          + Incidente
        </AdminButton>
      </div>
    </div>
  );
}
