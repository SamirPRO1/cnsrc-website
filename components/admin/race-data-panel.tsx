"use client";

import { useRef, useState, useEffect } from "react";
import type { RaceFileMeta } from "@/lib/admin/raceFilesIo";
import { useQuery } from "@/lib/admin/use-api";
import AdminButton from "./admin-button";

interface Props {
  championshipId: string;
  roundId: string;
  sessionId: string;
  /** currently associated filename, if any */
  currentFile?: string;
  lapCount: number;
  onIngested: () => void;
}

interface IngestResult {
  filename: string;
  lapsIngested: number;
  driversIngested: number;
  resultsIngested: number;
  incidentsIngested: number;
  skippedDrivers: string[];
}

export default function RaceDataPanel({
  championshipId,
  roundId,
  sessionId,
  currentFile,
  lapCount,
  onIngested,
}: Props) {
  const { data: files, refetch: refetchFiles } = useQuery<RaceFileMeta[]>(
    "/api/admin/race-files",
  );
  const [selected, setSelected] = useState(currentFile ?? "");
  const [query, setQuery] = useState(currentFile ?? "");
  const [open, setOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!selected) setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selected]);

  const filteredFiles = files?.filter((f) => {
    const q = query.toLowerCase();
    return (
      f.filename.toLowerCase().includes(q) ||
      f.eventName?.toLowerCase().includes(q) ||
      f.trackName?.toLowerCase().includes(q)
    );
  }) ?? [];

  const selectFile = (filename: string) => {
    setSelected(filename);
    setQuery(filename);
    setOpen(false);
  };
  const [message, setMessage] = useState<
    | { type: "ok"; text: string; skipped?: string[] }
    | { type: "error"; text: string }
    | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingestUrl = `/api/admin/championships/${championshipId}/rounds/${roundId}/sessions/${sessionId}/ingest`;

  const handleUpload = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/race-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Error al subir" });
      } else {
        setSelected(data.filename);
        setQuery(data.filename);
        await refetchFiles();
        setMessage({ type: "ok", text: `Archivo ${data.filename} subido` });
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Error al leer archivo",
      });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleIngest = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: selected }),
    });
    const data: IngestResult & { error?: string } = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Error al ingerir" });
    } else {
      setMessage({
        type: "ok",
        text: `${data.lapsIngested} vueltas · ${data.driversIngested} pilotos · ${data.resultsIngested} resultados · ${data.incidentsIngested} incidentes`,
        skipped: data.skippedDrivers,
      });
      onIngested();
    }
    setBusy(false);
  };

  const handleClear = async () => {
    if (!confirm("¿Vaciar todas las vueltas y desvincular el archivo?")) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: true }),
    });
    if (res.ok) {
      setSelected("");
      setQuery("");
      setMessage({ type: "ok", text: "Vueltas eliminadas" });
      onIngested();
    } else {
      setMessage({ type: "error", text: "Error al vaciar" });
    }
    setBusy(false);
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`¿Eliminar el archivo ${filename}?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/race-files/${filename}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (selected === filename) { setSelected(""); setQuery(""); }
      await refetchFiles();
    }
    setBusy(false);
  };

  return (
    <div
      style={{
        background: "var(--bg-surface-p1)",
        border: "1px solid var(--border-accent)",
        padding: 14,
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h4 className="label" style={{ margin: 0 }}>Datos de carrera</h4>
        {currentFile ? (
          <span className="mono" style={{ fontSize: 11, color: "var(--status-success)" }}>
            {lapCount} vueltas · {currentFile}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            Sin archivo asociado
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center" }}>
        <div ref={comboRef} style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            placeholder="Buscar archivo…"
            disabled={busy}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setSelected(""); setOpen(true); }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "6px 8px",
              fontSize: 12,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              outline: "none",
            }}
          />
          {open && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 50,
              background: "var(--bg-surface-p1)",
              border: "1px solid var(--border-accent)",
              borderTop: "none",
              maxHeight: 240,
              overflowY: "auto",
            }}>
              {filteredFiles.length === 0 ? (
                <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-tertiary)" }}>
                  Sin resultados
                </div>
              ) : filteredFiles.map((f) => (
                <div
                  key={f.filename}
                  onMouseDown={() => selectFile(f.filename)}
                  style={{
                    padding: "7px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                    background: selected === f.filename ? "var(--bg-surface-p2)" : "transparent",
                    borderBottom: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-p2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = selected === f.filename ? "var(--bg-surface-p2)" : "transparent")}
                >
                  <span style={{ fontWeight: selected === f.filename ? 600 : 400 }}>{f.filename}</span>
                  {(f.eventName || f.trackName || f.cars) && (
                    <span style={{ color: "var(--text-tertiary)", marginLeft: 6 }}>
                      {[f.eventName, f.trackName, f.cars ? `${f.cars} cars` : ""].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <AdminButton
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          style={{ fontSize: 11, padding: "6px 12px" }}
        >
          + Subir
        </AdminButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />

        <AdminButton
          onClick={handleIngest}
          disabled={busy || !selected}
          style={{ fontSize: 11, padding: "6px 12px" }}
        >
          {currentFile === selected && lapCount > 0 ? "Re-ingerir" : "Ingerir"}
        </AdminButton>

        {currentFile && (
          <AdminButton
            variant="danger"
            onClick={handleClear}
            disabled={busy}
            style={{ fontSize: 11, padding: "6px 12px" }}
          >
            Vaciar
          </AdminButton>
        )}
      </div>

      {selected && files?.find((f) => f.filename === selected) && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {(() => {
              const f = files.find((f) => f.filename === selected)!;
              const parts = [];
              if (f.eventName) parts.push(f.eventName);
              if (f.trackName) parts.push(f.trackName);
              if (f.laps) parts.push(`${f.laps} vueltas (cfg)`);
              if (f.resultCount) parts.push(`${f.resultCount} clasificados`);
              if (f.date) parts.push(new Date(f.date).toLocaleDateString("es-ES"));
              return parts.join(" · ");
            })()}
          </span>
          <button
            onClick={() => handleDeleteFile(selected)}
            style={{
              background: "none",
              border: "none",
              color: "var(--status-danger)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
            disabled={busy}
          >
            Eliminar archivo
          </button>
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            fontSize: 12,
            background:
              message.type === "ok"
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
            border: `1px solid ${
              message.type === "ok" ? "var(--status-success)" : "var(--status-danger)"
            }`,
            color:
              message.type === "ok" ? "var(--status-success)" : "var(--status-danger)",
          }}
        >
          {message.text}
          {message.type === "ok" &&
            "skipped" in message &&
            message.skipped &&
            message.skipped.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-secondary)" }}>
                <strong>Pilotos omitidos (sin GUID):</strong> {message.skipped.join(", ")}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
