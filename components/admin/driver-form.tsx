"use client";

import { useState } from "react";
import type { Driver, Team } from "@/lib/types";
import AdminFormField, { INPUT_STYLE, SELECT_STYLE } from "./admin-form-field";
import AdminButton from "./admin-button";

interface Props {
  initial?: Driver;
  teams: Team[];
  onSave: (driver: Driver) => void;
  onCancel: () => void;
  saving?: boolean;
}

const EMPTY: Driver = {
  id: "",
  name: "",
  number: "",
  country: "",
  teamId: "",
  license: "C",
  joined: "",
  picture: "",
  guids: [],
};

export default function DriverForm({ initial, teams, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<Driver>({ ...EMPTY, ...initial, guids: initial?.guids ?? [] });
  const [newGuid, setNewGuid] = useState("");
  const isNew = !initial;

  const set = <K extends keyof Driver>(k: K, v: Driver[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const addGuid = () => {
    const trimmed = newGuid.trim();
    if (!trimmed || form.guids!.includes(trimmed)) return;
    set("guids", [...form.guids!, trimmed]);
    setNewGuid("");
  };

  const removeGuid = (guid: string) =>
    set("guids", form.guids!.filter((g) => g !== guid));

  return (
    <div
      className="glass"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
    >
      <h3 className="display" style={{ fontSize: 16, margin: 0 }}>
        {isNew ? "Nuevo Piloto" : `Editar — ${form.name}`}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AdminFormField label="ID">
          <input
            style={INPUT_STYLE}
            value={form.id}
            onChange={(e) => set("id", e.target.value)}
            disabled={!isNew}
            placeholder="d01"
          />
        </AdminFormField>
        <AdminFormField label="Nombre">
          <input
            style={INPUT_STYLE}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Juan Perez"
          />
        </AdminFormField>
        <AdminFormField label="Numero">
          <input
            style={INPUT_STYLE}
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            placeholder="77"
          />
        </AdminFormField>
        <AdminFormField label="Pais">
          <input
            style={INPUT_STYLE}
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="CU"
          />
        </AdminFormField>
        <AdminFormField label="Equipo">
          <select
            style={SELECT_STYLE}
            value={form.teamId}
            onChange={(e) => set("teamId", e.target.value)}
          >
            <option value="">Sin equipo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Licencia">
          <select
            style={SELECT_STYLE}
            value={form.license}
            onChange={(e) => set("license", e.target.value as Driver["license"])}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </AdminFormField>
        <AdminFormField label="Temporada de ingreso">
          <input
            style={INPUT_STYLE}
            value={form.joined}
            onChange={(e) => set("joined", e.target.value)}
            placeholder="S01"
          />
        </AdminFormField>
        <AdminFormField label="Foto (ruta en /drivers/)">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              style={INPUT_STYLE}
              value={form.picture ?? ""}
              onChange={(e) => set("picture", e.target.value || undefined)}
              placeholder="/drivers/Nombre_Apellido.png"
            />
            {form.picture && (
              <img
                src={form.picture}
                alt=""
                style={{ width: 36, height: 36, objectFit: "cover", border: "1px solid var(--border-hairline)" }}
              />
            )}
          </div>
        </AdminFormField>
      </div>

      {/* Steam GUIDs */}
      <div>
        <p
          style={{
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: 10,
            color: "var(--text-tertiary)",
            margin: "0 0 8px",
          }}
        >
          Steam GUIDs
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {form.guids!.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Sin GUIDs registrados</span>
          )}
          {form.guids!.map((guid) => (
            <div key={guid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-hairline)",
                  padding: "3px 8px",
                  flex: 1,
                }}
              >
                {guid}
              </span>
              <button
                onClick={() => removeGuid(guid)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--status-danger)",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: "2px 4px",
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...INPUT_STYLE, flex: 1, fontFamily: "var(--font-mono)", fontSize: 12 }}
            value={newGuid}
            onChange={(e) => setNewGuid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGuid()}
            placeholder="76561199141189138"
          />
          <AdminButton
            variant="secondary"
            onClick={addGuid}
            disabled={!newGuid.trim()}
            style={{ fontSize: 11, padding: "4px 12px", whiteSpace: "nowrap" }}
          >
            + GUID
          </AdminButton>
        </div>
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
