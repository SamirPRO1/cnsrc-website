"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Round, Session, Driver, Team, Championship } from "@/lib/types";
import { useQuery } from "@/lib/admin/use-api";
import AdminButton from "@/components/admin/admin-button";
import AdminFormField, { INPUT_STYLE, SELECT_STYLE } from "@/components/admin/admin-form-field";
import AdminDialog from "@/components/admin/admin-dialog";
import ResultsEditor from "@/components/admin/results-editor";
import IncidentsEditor from "@/components/admin/incidents-editor";
import RaceDataPanel from "@/components/admin/race-data-panel";

export default function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const { id, roundId } = use(params);
  const { data: round, loading, refetch } = useQuery<Round>(
    `/api/admin/championships/${id}/rounds/${roundId}`,
  );
  const { data: champ } = useQuery<Championship>(`/api/admin/championships/${id}`);
  const { data: drivers } = useQuery<Driver[]>("/api/admin/drivers");
  const { data: teams } = useQuery<Team[]>("/api/admin/teams");

  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [addingSession, setAddingSession] = useState(false);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  useEffect(() => { if (round) setYoutubeUrl(round.youtubeUrl ?? ""); }, [round?.id]);

  // New session state
  const [newSession, setNewSession] = useState({
    type: "race" as Session["type"],
    subLabel: "",
  });

  // Track session edits locally
  const [sessionEdits, setSessionEdits] = useState<Record<string, Partial<Session>>>({});

  const getSessionEdit = useCallback(
    (s: Session): Session => ({ ...s, ...sessionEdits[s.id] }),
    [sessionEdits],
  );

  const updateSessionEdit = (sessionId: string, patch: Partial<Session>) => {
    setSessionEdits((prev) => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], ...patch },
    }));
  };

  if (loading || !round)
    return <p style={{ color: "var(--text-tertiary)" }}>Cargando...</p>;

  const classes = champ?.classes ?? [];

  const handleAddSession = async () => {
    const sessionIndex = round.sessions.length + 1;
    const typePrefix =
      newSession.type === "practice" ? "p" : newSession.type === "qualifying" ? "q" : "r";
    const sessionId = `${roundId}-${typePrefix}${sessionIndex}`;

    setSaving(true);
    await fetch(`/api/admin/championships/${id}/rounds/${roundId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sessionId,
        type: newSession.type,
        subLabel: newSession.subLabel || undefined,
        status: "upcoming",
        conditions: { airTemp: 25, trackTemp: 35, weather: "Despejado" },
        results: [],
        laps: [],
        incidents: [],
      }),
    });
    setSaving(false);
    setAddingSession(false);
    refetch();
  };

  const handleSaveSession = async (session: Session) => {
    const edited = getSessionEdit(session);
    setSaving(true);
    await fetch(
      `/api/admin/championships/${id}/rounds/${roundId}/sessions/${session.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edited),
      },
    );
    setSaving(false);
    setSessionEdits((prev) => {
      const next = { ...prev };
      delete next[session.id];
      return next;
    });
    refetch();
  };

  const handleSaveRound = async () => {
    if (!round) return;
    setSaving(true);
    await fetch(`/api/admin/championships/${id}/rounds/${roundId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...round, youtubeUrl: youtubeUrl || undefined }),
    });
    setSaving(false);
    refetch();
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    await fetch(
      `/api/admin/championships/${id}/rounds/${roundId}/sessions/${deletingSession}`,
      { method: "DELETE" },
    );
    setDeletingSession(null);
    refetch();
  };

  const sessionTypeLabel = (type: string) => {
    switch (type) {
      case "practice": return "Practica";
      case "qualifying": return "Clasificacion";
      case "race": return "Carrera";
      default: return type;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/admin/championships/${id}`}
          style={{ color: "var(--text-tertiary)", fontSize: 12, textDecoration: "none" }}
        >
          &larr; {champ?.name ?? id}
        </Link>
        <h1 className="display" style={{ fontSize: 28, margin: "8px 0 0" }}>
          R{String(round.index).padStart(2, "0")} — {round.track.name}
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          {round.date} &middot; {round.track.short} &middot; {round.status}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <input
            style={{ ...INPUT_STYLE, flex: 1, fontSize: 12 }}
            type="url"
            value={youtubeUrl}
            placeholder="YouTube URL de la ronda (aplica a todas las sesiones)..."
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
          <AdminButton onClick={handleSaveRound} disabled={saving} style={{ fontSize: 11, padding: "6px 12px", flexShrink: 0 }}>
            {saving ? "Guardando..." : "Guardar URL"}
          </AdminButton>
        </div>
      </div>

      {/* Sessions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 20, margin: 0 }}>
          Sesiones ({round.sessions.length})
        </h2>
        <AdminButton onClick={() => setAddingSession(!addingSession)} style={{ fontSize: 12 }}>
          + Sesion
        </AdminButton>
      </div>

      {addingSession && (
        <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <AdminFormField label="Tipo">
              <select
                style={SELECT_STYLE}
                value={newSession.type}
                onChange={(e) =>
                  setNewSession({ ...newSession, type: e.target.value as Session["type"] })
                }
              >
                <option value="practice">Practica</option>
                <option value="qualifying">Clasificacion</option>
                <option value="race">Carrera</option>
              </select>
            </AdminFormField>
            <AdminFormField label="Etiqueta (ej. R1, R2)">
              <input
                style={INPUT_STYLE}
                value={newSession.subLabel}
                onChange={(e) => setNewSession({ ...newSession, subLabel: e.target.value })}
                placeholder="R1"
              />
            </AdminFormField>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <AdminButton onClick={handleAddSession} disabled={saving}>
              Crear Sesion
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setAddingSession(false)}>
              Cancelar
            </AdminButton>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {round.sessions.map((session) => {
          const isExpanded = expandedSession === session.id;
          const edited = getSessionEdit(session);
          const hasEdits = !!sessionEdits[session.id];

          return (
            <div key={session.id} className="glass" style={{ padding: 0 }}>
              {/* Session header */}
              <div
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14 }}>
                    {sessionTypeLabel(session.type)}
                    {session.subLabel && (
                      <span className="mono" style={{ marginLeft: 6, color: "var(--text-tertiary)" }}>
                        {session.subLabel}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {session.results.length} resultados
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    {session.status}
                  </span>
                  <span style={{ color: "var(--text-tertiary)", fontSize: 16 }}>
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </div>
              </div>

              {/* Expanded session editor */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0 20px 20px",
                    borderTop: "1px solid var(--border-hairline)",
                  }}
                >
                  {/* Race data ingestion (race sessions only) */}
                  {session.type === "race" && (
                    <div style={{ marginTop: 16 }}>
                      <RaceDataPanel
                        championshipId={id}
                        roundId={roundId}
                        sessionId={session.id}
                        currentFile={session.raceDataFile}
                        lapCount={session.laps.length}
                        onIngested={refetch}
                      />
                    </div>
                  )}

                  {/* Conditions */}
                  <div style={{ marginTop: 16, marginBottom: 16 }}>
                    <h4 className="label" style={{ marginBottom: 8 }}>
                      Condiciones
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                      <AdminFormField label="Aire (C)">
                        <input
                          style={INPUT_STYLE}
                          type="number"
                          value={edited.conditions.airTemp}
                          onChange={(e) =>
                            updateSessionEdit(session.id, {
                              conditions: {
                                ...edited.conditions,
                                airTemp: +e.target.value,
                              },
                            })
                          }
                        />
                      </AdminFormField>
                      <AdminFormField label="Pista (C)">
                        <input
                          style={INPUT_STYLE}
                          type="number"
                          value={edited.conditions.trackTemp}
                          onChange={(e) =>
                            updateSessionEdit(session.id, {
                              conditions: {
                                ...edited.conditions,
                                trackTemp: +e.target.value,
                              },
                            })
                          }
                        />
                      </AdminFormField>
                      <AdminFormField label="Clima">
                        <input
                          style={INPUT_STYLE}
                          value={edited.conditions.weather}
                          onChange={(e) =>
                            updateSessionEdit(session.id, {
                              conditions: {
                                ...edited.conditions,
                                weather: e.target.value,
                              },
                            })
                          }
                        />
                      </AdminFormField>
                      <AdminFormField label="Estado">
                        <select
                          style={SELECT_STYLE}
                          value={edited.status}
                          onChange={(e) =>
                            updateSessionEdit(session.id, {
                              status: e.target.value as Session["status"],
                            })
                          }
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live</option>
                          <option value="done">Done</option>
                        </select>
                      </AdminFormField>
                    </div>
                  </div>

                  {/* Results */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 className="label" style={{ marginBottom: 8 }}>
                      Resultados
                    </h4>
                    <ResultsEditor
                      results={edited.results}
                      drivers={drivers ?? []}
                      teams={teams ?? []}
                      classes={classes}
                      onChange={(results) =>
                        updateSessionEdit(session.id, { results })
                      }
                      pointsTable={session.type === "race" ? champ?.pointsTable : undefined}
                      isRace2={session.subLabel === "R2"}
                    />
                  </div>

                  {/* Incidents */}
                  <div style={{ marginBottom: 16 }}>
                    <h4 className="label" style={{ marginBottom: 8 }}>
                      Incidentes
                    </h4>
                    <IncidentsEditor
                      incidents={edited.incidents}
                      drivers={drivers ?? []}
                      onChange={(incidents) =>
                        updateSessionEdit(session.id, { incidents })
                      }
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                    <AdminButton
                      variant="danger"
                      onClick={() => setDeletingSession(session.id)}
                      style={{ fontSize: 11, padding: "6px 12px" }}
                    >
                      Eliminar Sesion
                    </AdminButton>
                    <AdminButton
                      onClick={() => handleSaveSession(session)}
                      disabled={saving || !hasEdits}
                      style={{ fontSize: 11, padding: "6px 12px" }}
                    >
                      {saving ? "Guardando..." : "Guardar Sesion"}
                    </AdminButton>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AdminDialog
        open={!!deletingSession}
        title="Eliminar sesion"
        message="¿Eliminar esta sesion y todos sus datos? Esta accion no se puede deshacer."
        onConfirm={handleDeleteSession}
        onCancel={() => setDeletingSession(null)}
      />
    </div>
  );
}
