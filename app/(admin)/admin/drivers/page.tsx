"use client";

import { useState } from "react";
import type { Driver, Team } from "@/lib/types";
import { useQuery, useMutation } from "@/lib/admin/use-api";
import AdminDataTable, { type Column } from "@/components/admin/admin-data-table";
import AdminButton from "@/components/admin/admin-button";
import AdminDialog from "@/components/admin/admin-dialog";
import DriverForm from "@/components/admin/driver-form";

export default function DriversAdminPage() {
  const { data: drivers, loading, refetch } = useQuery<Driver[]>("/api/admin/drivers");
  const { data: teams } = useQuery<Team[]>("/api/admin/teams");
  const [editing, setEditing] = useState<Driver | "new" | null>(null);
  const [deleting, setDeleting] = useState<Driver | null>(null);

  const createMut = useMutation<Driver>("/api/admin/drivers", "POST");
  const deleteMut = useMutation("/api/admin/drivers", "DELETE");

  const handleSave = async (driver: Driver) => {
    const isNew = editing === "new";
    const url = isNew ? "/api/admin/drivers" : `/api/admin/drivers/${driver.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driver),
    });
    if (res.ok) {
      setEditing(null);
      refetch();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/admin/drivers/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      refetch();
    }
  };

  const teamName = (id: string) =>
    teams?.find((t) => t.id === id)?.name ?? (id || "—");

  const columns: Column<Driver>[] = [
    { key: "number", header: "#", render: (d) => <span className="mono">{d.number}</span>, width: "60px" },
    { key: "name", header: "Nombre", render: (d) => d.name },
    { key: "country", header: "Pais", render: (d) => d.country, width: "80px" },
    { key: "team", header: "Equipo", render: (d) => teamName(d.teamId) },
    { key: "license", header: "Lic.", render: (d) => d.license, width: "60px" },
    { key: "joined", header: "Desde", render: (d) => d.joined, width: "80px" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Pilotos</h1>
        <AdminButton onClick={() => setEditing("new")}>+ Nuevo Piloto</AdminButton>
      </div>

      {editing && (
        <div style={{ marginBottom: 24 }}>
          <DriverForm
            initial={editing === "new" ? undefined : editing}
            teams={teams ?? []}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={createMut.loading}
          />
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>Cargando...</p>
      ) : (
        <div className="glass" style={{ padding: 0 }}>
          <AdminDataTable
            columns={columns}
            rows={drivers ?? []}
            keyFn={(d) => d.id}
            onEdit={(d) => setEditing(d)}
            onDelete={(d) => setDeleting(d)}
          />
        </div>
      )}

      <AdminDialog
        open={!!deleting}
        title="Eliminar piloto"
        message={`¿Eliminar a ${deleting?.name}? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
