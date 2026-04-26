"use client";

import { useState } from "react";
import type { TrackRef } from "@/lib/types";
import AdminFormField, { INPUT_STYLE, SELECT_STYLE } from "./admin-form-field";
import AdminButton from "./admin-button";

interface Props {
  initial?: TrackRef;
  onSave: (track: TrackRef) => void;
  onCancel: () => void;
  saving?: boolean;
}

const EMPTY: TrackRef = {
  id: "",
  name: "",
  short: "",
  country: "",
  layout: "Grand Prix",
  lengthKm: 0,
  turns: 0,
};

const LAYOUTS = [
  "Grand Prix",
  "Street Circuit",
  "Road Course",
  "Oval",
  "Semi-street",
];

export default function TrackForm({ initial, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<TrackRef>(initial ?? EMPTY);
  const isNew = !initial;

  const set = <K extends keyof TrackRef>(k: K, v: TrackRef[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      className="glass"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
    >
      <h3 className="display" style={{ fontSize: 16, margin: 0 }}>
        {isNew ? "Nuevo Circuito" : `Editar — ${form.name}`}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AdminFormField label="ID">
          <input
            style={INPUT_STYLE}
            value={form.id}
            onChange={(e) => set("id", e.target.value)}
            disabled={!isNew}
            placeholder="bahrain"
          />
        </AdminFormField>
        <AdminFormField label="Nombre">
          <input
            style={INPUT_STYLE}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Bahrain International Circuit"
          />
        </AdminFormField>
        <AdminFormField label="Codigo corto">
          <input
            style={INPUT_STYLE}
            value={form.short}
            onChange={(e) => set("short", e.target.value)}
            placeholder="BHR"
          />
        </AdminFormField>
        <AdminFormField label="Pais">
          <input
            style={INPUT_STYLE}
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="BH"
          />
        </AdminFormField>
        <AdminFormField label="Longitud (km)">
          <input
            style={INPUT_STYLE}
            type="number"
            step="0.001"
            value={form.lengthKm}
            onChange={(e) => set("lengthKm", parseFloat(e.target.value) || 0)}
          />
        </AdminFormField>
        <AdminFormField label="Curvas">
          <input
            style={INPUT_STYLE}
            type="number"
            value={form.turns}
            onChange={(e) => set("turns", parseInt(e.target.value) || 0)}
          />
        </AdminFormField>
        <AdminFormField label="Tipo de trazado">
          <select
            style={SELECT_STYLE}
            value={form.layout}
            onChange={(e) => set("layout", e.target.value)}
          >
            {LAYOUTS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </AdminFormField>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <AdminButton variant="secondary" onClick={onCancel}>
          Cancelar
        </AdminButton>
        <AdminButton onClick={() => onSave(form)} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </AdminButton>
      </div>
    </div>
  );
}
