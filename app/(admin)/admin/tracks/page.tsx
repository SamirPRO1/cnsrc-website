"use client";

import { useState } from "react";
import type { TrackRef } from "@/lib/types";
import { useQuery } from "@/lib/admin/use-api";
import AdminDataTable, { type Column } from "@/components/admin/admin-data-table";
import AdminButton from "@/components/admin/admin-button";
import AdminDialog from "@/components/admin/admin-dialog";
import TrackForm from "@/components/admin/track-form";

export default function TracksAdminPage() {
  const { data: tracks, loading, refetch } = useQuery<TrackRef[]>("/api/admin/tracks");
  const [editing, setEditing] = useState<TrackRef | "new" | null>(null);
  const [deleting, setDeleting] = useState<TrackRef | null>(null);

  const handleSave = async (track: TrackRef) => {
    const isNew = editing === "new";
    const url = isNew ? "/api/admin/tracks" : `/api/admin/tracks/${track.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(track),
    });
    if (res.ok) {
      setEditing(null);
      refetch();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/admin/tracks/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      refetch();
    }
  };

  const columns: Column<TrackRef>[] = [
    { key: "short", header: "Cod.", render: (t) => <span className="mono">{t.short}</span>, width: "70px" },
    { key: "name", header: "Nombre", render: (t) => t.name },
    { key: "country", header: "Pais", render: (t) => t.country, width: "70px" },
    { key: "length", header: "Km", render: (t) => <span className="mono">{t.lengthKm}</span>, width: "80px" },
    { key: "turns", header: "Curvas", render: (t) => <span className="mono">{t.turns}</span>, width: "70px" },
    { key: "layout", header: "Tipo", render: (t) => t.layout },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Circuitos</h1>
        <AdminButton onClick={() => setEditing("new")}>+ Nuevo Circuito</AdminButton>
      </div>

      {editing && (
        <div style={{ marginBottom: 24 }}>
          <TrackForm
            initial={editing === "new" ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>Cargando...</p>
      ) : (
        <div className="glass" style={{ padding: 0 }}>
          <AdminDataTable
            columns={columns}
            rows={tracks ?? []}
            keyFn={(t) => t.id}
            onEdit={(t) => setEditing(t)}
            onDelete={(t) => setDeleting(t)}
          />
        </div>
      )}

      <AdminDialog
        open={!!deleting}
        title="Eliminar circuito"
        message={`¿Eliminar ${deleting?.name}? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
