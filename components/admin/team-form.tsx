"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";
import AdminFormField, { INPUT_STYLE } from "./admin-form-field";
import AdminButton from "./admin-button";

interface Props {
  initial?: Team;
  onSave: (team: Team) => void;
  onCancel: () => void;
  saving?: boolean;
}

const EMPTY: Team = { id: "", name: "" };

export default function TeamForm({ initial, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<Team>(initial ?? EMPTY);
  const isNew = !initial;

  const set = <K extends keyof Team>(k: K, v: Team[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      className="glass"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
    >
      <h3 className="display" style={{ fontSize: 16, margin: 0 }}>
        {isNew ? "Nuevo Equipo" : `Editar — ${form.name}`}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AdminFormField label="ID">
          <input
            style={INPUT_STYLE}
            value={form.id}
            onChange={(e) => set("id", e.target.value)}
            disabled={!isNew}
            placeholder="team-name"
          />
        </AdminFormField>
        <AdminFormField label="Nombre">
          <input
            style={INPUT_STYLE}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Team Name"
          />
        </AdminFormField>
        <AdminFormField label="Color 1">
          <input
            style={{ ...INPUT_STYLE, height: 38 }}
            type="color"
            value={form.colors?.[0] ?? "#E4173D"}
            onChange={(e) =>
              set("colors", [e.target.value, form.colors?.[1] ?? "#ffffff"])
            }
          />
        </AdminFormField>
        <AdminFormField label="Color 2">
          <input
            style={{ ...INPUT_STYLE, height: 38 }}
            type="color"
            value={form.colors?.[1] ?? "#ffffff"}
            onChange={(e) =>
              set("colors", [form.colors?.[0] ?? "#E4173D", e.target.value])
            }
          />
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
