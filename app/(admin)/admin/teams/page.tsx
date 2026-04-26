"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";
import { useQuery } from "@/lib/admin/use-api";
import AdminDataTable, { type Column } from "@/components/admin/admin-data-table";
import AdminButton from "@/components/admin/admin-button";
import AdminDialog from "@/components/admin/admin-dialog";
import TeamForm from "@/components/admin/team-form";

export default function TeamsAdminPage() {
  const { data: teams, loading, refetch } = useQuery<Team[]>("/api/admin/teams");
  const [editing, setEditing] = useState<Team | "new" | null>(null);
  const [deleting, setDeleting] = useState<Team | null>(null);

  const handleSave = async (team: Team) => {
    const isNew = editing === "new";
    const url = isNew ? "/api/admin/teams" : `/api/admin/teams/${team.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    });
    if (res.ok) {
      setEditing(null);
      refetch();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/admin/teams/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      refetch();
    }
  };

  const columns: Column<Team>[] = [
    { key: "id", header: "ID", render: (t) => <span className="mono">{t.id}</span>, width: "200px" },
    { key: "name", header: "Nombre", render: (t) => t.name },
    {
      key: "colors",
      header: "Colores",
      render: (t) =>
        t.colors ? (
          <div style={{ display: "flex", gap: 4 }}>
            <span
              style={{
                width: 20,
                height: 20,
                background: t.colors[0],
                border: "1px solid var(--border-hairline)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                width: 20,
                height: 20,
                background: t.colors[1],
                border: "1px solid var(--border-hairline)",
                display: "inline-block",
              }}
            />
          </div>
        ) : (
          "—"
        ),
      width: "100px",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Equipos</h1>
        <AdminButton onClick={() => setEditing("new")}>+ Nuevo Equipo</AdminButton>
      </div>

      {editing && (
        <div style={{ marginBottom: 24 }}>
          <TeamForm
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
            rows={teams ?? []}
            keyFn={(t) => t.id}
            onEdit={(t) => setEditing(t)}
            onDelete={(t) => setDeleting(t)}
          />
        </div>
      )}

      <AdminDialog
        open={!!deleting}
        title="Eliminar equipo"
        message={`¿Eliminar ${deleting?.name}? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
