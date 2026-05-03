"use client";

import { use, useState } from "react";
import Link from "next/link";
import type { Championship, TrackRef, PointsTable } from "@/lib/types";
import { useQuery } from "@/lib/admin/use-api";
import AdminButton from "@/components/admin/admin-button";
import AdminFormField, { INPUT_STYLE, SELECT_STYLE } from "@/components/admin/admin-form-field";
import AdminDialog from "@/components/admin/admin-dialog";
import PointsTableEditor from "@/components/admin/points-table-editor";

const STATUS_COLORS: Record<string, string> = {
  done: "var(--status-success)",
  live: "var(--accent-red)",
  upcoming: "var(--status-warning)",
};

export default function ChampionshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: champ, loading, refetch } = useQuery<Championship>(
    `/api/admin/championships/${id}`,
  );
  const { data: tracks } = useQuery<TrackRef[]>("/api/admin/tracks");
  const [editingMeta, setEditingMeta] = useState(false);
  const [editingClasses, setEditingClasses] = useState(false);
  const [classEdits, setClassEdits] = useState<Record<string, { label: string; car: string }>>({});
  const [addingRound, setAddingRound] = useState(false);
  const [deletingRound, setDeletingRound] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingDate, setEditingDate] = useState<Record<string, string>>({});

  /* ── New round state ─────────── */
  const [newRound, setNewRound] = useState({
    roundIndex: (champ?.rounds.length ?? 0) + 1,
    trackId: "",
    date: "",
    status: "upcoming" as "upcoming" | "live" | "done",
  });

  if (loading || !champ)
    return <p style={{ color: "var(--text-tertiary)" }}>Cargando...</p>;

  const handleSaveMeta = async () => {
    setSaving(true);
    await fetch(`/api/admin/championships/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(champ),
    });
    setSaving(false);
    setEditingMeta(false);
    refetch();
  };

  const handleEditClasses = () => {
    setClassEdits(Object.fromEntries(champ!.classes.map((c) => [c.id, { label: c.label, car: c.car }])));
    setEditingClasses(true);
  };

  const handleSaveClasses = async () => {
    if (!champ) return;
    const updatedClasses = champ.classes.map((c) => ({
      ...c,
      ...(classEdits[c.id] ?? {}),
    }));
    setSaving(true);
    await fetch(`/api/admin/championships/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...champ, classes: updatedClasses }),
    });
    setSaving(false);
    setEditingClasses(false);
    refetch();
  };

  const handleSavePointsTable = async (table: PointsTable) => {
    if (!champ) return;
    setSaving(true);
    await fetch(`/api/admin/championships/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...champ, pointsTable: table }),
    });
    setSaving(false);
    refetch();
  };

  const handleSaveDate = async (roundId: string) => {
    const newDate = editingDate[roundId];
    if (!newDate || !champ) return;
    const round = champ.rounds.find((r) => r.id === roundId);
    if (!round) return;
    setSaving(true);
    await fetch(`/api/admin/championships/${id}/rounds/${roundId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...round, date: newDate }),
    });
    setSaving(false);
    setEditingDate((prev) => {
      const next = { ...prev };
      delete next[roundId];
      return next;
    });
    refetch();
  };

  const handleAddRound = async () => {
    const track = tracks?.find((t) => t.id === newRound.trackId);
    if (!track) return;
    setSaving(true);
    const roundId = `${id}-r${String(newRound.roundIndex).padStart(2, "0")}`;
    await fetch(`/api/admin/championships/${id}/rounds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: roundId,
        index: newRound.roundIndex,
        track,
        date: newRound.date,
        status: newRound.status,
        sessions: [],
      }),
    });
    setSaving(false);
    setAddingRound(false);
    refetch();
  };

  const handleDeleteRound = async () => {
    if (!deletingRound) return;
    await fetch(`/api/admin/championships/${id}/rounds/${deletingRound}`, {
      method: "DELETE",
    });
    setDeletingRound(null);
    refetch();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin/championships"
          style={{ color: "var(--text-tertiary)", fontSize: 12, textDecoration: "none" }}
        >
          &larr; Campeonatos
        </Link>
        <h1 className="display" style={{ fontSize: 28, margin: "8px 0 0" }}>
          {champ.name}
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          {champ.season} &middot; {champ.year} &middot; {champ.status}
        </span>
      </div>

      {/* Metadata edit */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="display" style={{ fontSize: 16, margin: 0 }}>
            Metadatos
          </h2>
          <AdminButton
            variant="secondary"
            onClick={() => setEditingMeta(!editingMeta)}
            style={{ fontSize: 11, padding: "4px 12px" }}
          >
            {editingMeta ? "Cancelar" : "Editar"}
          </AdminButton>
        </div>
        {!editingMeta && (
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>{champ.name}</span>
            <span style={{ color: "var(--text-tertiary)" }}>{champ.status}</span>
            <span style={{ color: champ.teamPoints ? "var(--status-success)" : "var(--text-tertiary)" }}>
              Puntos por equipo: {champ.teamPoints ? "ON" : "OFF"}
            </span>
          </div>
        )}
        {editingMeta && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <AdminFormField label="Nombre">
                <input
                  style={INPUT_STYLE}
                  value={champ.name}
                  onChange={(e) => { champ.name = e.target.value; refetch(); }}
                />
              </AdminFormField>
              <AdminFormField label="Temporada">
                <input style={INPUT_STYLE} value={champ.season} readOnly />
              </AdminFormField>
              <AdminFormField label="Estado">
                <select
                  style={SELECT_STYLE}
                  value={champ.status}
                  onChange={(e) => { champ.status = e.target.value as Championship["status"]; refetch(); }}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="complete">Complete</option>
                </select>
              </AdminFormField>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={champ.teamPoints ?? false}
                  onChange={(e) => { champ.teamPoints = e.target.checked; refetch(); }}
                  style={{ width: 16, height: 16, accentColor: "var(--accent-red)", cursor: "pointer" }}
                />
                <span style={{ color: "var(--text-primary)" }}>Puntos por equipo</span>
                <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>Muestra tabla de clasificación por equipos en la página pública</span>
              </label>
            </div>
            <AdminButton onClick={handleSaveMeta} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Metadatos"}
            </AdminButton>
          </div>
        )}
      </div>

      {/* Classes */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="display" style={{ fontSize: 16, margin: 0 }}>
            Clases ({champ.classes.length})
          </h2>
          <AdminButton
            variant="secondary"
            onClick={() => editingClasses ? setEditingClasses(false) : handleEditClasses()}
            style={{ fontSize: 11, padding: "4px 12px" }}
          >
            {editingClasses ? "Cancelar" : "Editar"}
          </AdminButton>
        </div>
        {!editingClasses ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {champ.classes.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 16, fontSize: 13 }}>
                <span className="mono" style={{ color: "var(--text-tertiary)", minWidth: 80 }}>{c.id}</span>
                <span style={{ color: "var(--text-primary)", minWidth: 100 }}>{c.label}</span>
                <span style={{ color: "var(--text-secondary)" }}>{c.car}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {champ.classes.map((c) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 12, alignItems: "center" }}>
                  <span className="mono" style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{c.id}</span>
                  <AdminFormField label="Nombre">
                    <input
                      style={INPUT_STYLE}
                      value={classEdits[c.id]?.label ?? c.label}
                      onChange={(e) =>
                        setClassEdits((prev) => ({ ...prev, [c.id]: { ...prev[c.id], label: e.target.value } }))
                      }
                    />
                  </AdminFormField>
                  <AdminFormField label="Auto">
                    <input
                      style={INPUT_STYLE}
                      value={classEdits[c.id]?.car ?? c.car}
                      onChange={(e) =>
                        setClassEdits((prev) => ({ ...prev, [c.id]: { ...prev[c.id], car: e.target.value } }))
                      }
                    />
                  </AdminFormField>
                </div>
              ))}
            </div>
            <AdminButton onClick={handleSaveClasses} disabled={saving}>
              {saving ? "Guardando..." : "Guardar Clases"}
            </AdminButton>
          </div>
        )}
      </div>

      {/* Points table */}
      <div className="glass" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="display" style={{ fontSize: 16, margin: 0 }}>
            Tabla de puntos
          </h2>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            Aplica a todas las rondas — usado al ingerir resultados
          </span>
        </div>
        <PointsTableEditor
          initial={champ.pointsTable}
          onSave={handleSavePointsTable}
          saving={saving}
        />
      </div>

      {/* Rounds */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>
          Rondas ({champ.rounds.length})
        </h2>
        <AdminButton onClick={() => setAddingRound(!addingRound)} style={{ fontSize: 12 }}>
          + Ronda
        </AdminButton>
      </div>

      {addingRound && (
        <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
          <h3 className="display" style={{ fontSize: 14, margin: "0 0 12px" }}>
            Nueva Ronda
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 150px 120px", gap: 12, marginBottom: 12 }}>
            <AdminFormField label="Indice">
              <input
                style={INPUT_STYLE}
                type="number"
                value={newRound.roundIndex}
                onChange={(e) => setNewRound({ ...newRound, roundIndex: +e.target.value })}
              />
            </AdminFormField>
            <AdminFormField label="Circuito">
              <select
                style={SELECT_STYLE}
                value={newRound.trackId}
                onChange={(e) => setNewRound({ ...newRound, trackId: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {tracks?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField label="Fecha">
              <input
                style={INPUT_STYLE}
                value={newRound.date}
                onChange={(e) => setNewRound({ ...newRound, date: e.target.value })}
                placeholder="25 Abr 2026"
              />
            </AdminFormField>
            <AdminFormField label="Estado">
              <select
                style={SELECT_STYLE}
                value={newRound.status}
                onChange={(e) =>
                  setNewRound({
                    ...newRound,
                    status: e.target.value as "upcoming" | "live" | "done",
                  })
                }
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="done">Done</option>
              </select>
            </AdminFormField>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <AdminButton onClick={handleAddRound} disabled={saving || !newRound.trackId}>
              Crear Ronda
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setAddingRound(false)}>
              Cancelar
            </AdminButton>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {champ.rounds.map((round) => (
          <div
            key={round.id}
            className="glass"
            style={{
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
              <span
                className="mono"
                style={{ color: "var(--text-tertiary)", fontSize: 13, width: 30 }}
              >
                R{String(round.index).padStart(2, "0")}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{round.track.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <input
                    style={{
                      ...INPUT_STYLE,
                      width: 140,
                      padding: "3px 8px",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                    }}
                    value={editingDate[round.id] ?? round.date}
                    onChange={(e) =>
                      setEditingDate((prev) => ({ ...prev, [round.id]: e.target.value }))
                    }
                    placeholder="25 Abr 2026"
                  />
                  {editingDate[round.id] && editingDate[round.id] !== round.date && (
                    <button
                      onClick={() => handleSaveDate(round.id)}
                      disabled={saving}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--status-success)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Guardar
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    &middot; {round.sessions.length} sesiones
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 11,
                  color: STATUS_COLORS[round.status] ?? "var(--text-tertiary)",
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {round.status}
              </span>
              <Link
                href={`/admin/championships/${id}/rounds/${round.id}`}
                style={{
                  color: "var(--accent-red)",
                  fontSize: 12,
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                }}
              >
                Gestionar
              </Link>
              <button
                onClick={() => setDeletingRound(round.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--status-danger)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <AdminDialog
        open={!!deletingRound}
        title="Eliminar ronda"
        message="¿Eliminar esta ronda y todas sus sesiones? Esta accion no se puede deshacer."
        onConfirm={handleDeleteRound}
        onCancel={() => setDeletingRound(null)}
      />
    </div>
  );
}
