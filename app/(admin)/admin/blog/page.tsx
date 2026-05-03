"use client";

import { useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/types";
import { useQuery } from "@/lib/admin/use-api";
import AdminDataTable, { type Column } from "@/components/admin/admin-data-table";
import AdminButton from "@/components/admin/admin-button";
import AdminDialog from "@/components/admin/admin-dialog";
import BlogForm from "@/components/admin/blog-form";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function BlogAdminPage() {
  const { data: posts, loading, refetch } = useQuery<BlogPost[]>("/api/admin/blog");
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (post: BlogPost) => {
    setSaving(true);
    setError(null);
    try {
      const isNew = editing === "new";
      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${post.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          setError(j.error ?? text);
        } catch {
          setError(text);
        }
        return;
      }
      setEditing(null);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/admin/blog/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      refetch();
    }
  };

  const columns: Column<BlogPost>[] = [
    {
      key: "publishedAt",
      header: "Fecha",
      render: (p) => <span className="mono">{formatDate(p.publishedAt)}</span>,
      width: "180px",
    },
    {
      key: "title",
      header: "Título",
      render: (p) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "var(--text-primary)" }}>{p.title}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.id}</span>
        </div>
      ),
    },
    { key: "author", header: "Autor", render: (p) => p.author || "—", width: "160px" },
    {
      key: "draft",
      header: "Estado",
      render: (p) =>
        p.draft ? (
          <span style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.16em", color: "var(--status-warning)" }}>BORRADOR</span>
        ) : (
          <span style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.16em", color: "var(--status-success)" }}>PUBLICADO</span>
        ),
      width: "120px",
    },
    {
      key: "view",
      header: "",
      render: (p) =>
        p.draft ? (
          <span className="label" style={{ color: "var(--text-tertiary)" }}>—</span>
        ) : (
          <Link
            href={`/blog/${p.id}`}
            target="_blank"
            style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.12em", color: "var(--accent-red)", textDecoration: "none" }}
          >
            VER ↗
          </Link>
        ),
      width: "60px",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Blog</h1>
        <AdminButton onClick={() => { setError(null); setEditing("new"); }}>+ Nueva publicación</AdminButton>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          padding: "10px 14px",
          fontSize: 13,
          color: "var(--status-danger)",
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {editing && (
        <div style={{ marginBottom: 24 }}>
          <BlogForm
            initial={editing === "new" ? undefined : editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setError(null); }}
            saving={saving}
          />
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>Cargando...</p>
      ) : (
        <div className="glass" style={{ padding: 0 }}>
          <AdminDataTable
            columns={columns}
            rows={posts ?? []}
            keyFn={(p) => p.id}
            onEdit={(p) => { setError(null); setEditing(p); }}
            onDelete={(p) => setDeleting(p)}
          />
        </div>
      )}

      <AdminDialog
        open={!!deleting}
        title="Eliminar publicación"
        message={`¿Eliminar "${deleting?.title}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
