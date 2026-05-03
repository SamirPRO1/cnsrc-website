"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/types";
import AdminFormField, { INPUT_STYLE } from "./admin-form-field";
import AdminButton from "./admin-button";

interface Props {
  initial?: BlogPost;
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
  saving?: boolean;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function nowLocalISO(): string {
  // For an HTML datetime-local input. Trim seconds for cleanliness.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY: BlogPost = {
  id: "",
  title: "",
  excerpt: "",
  body: "",
  author: "",
  coverImage: "",
  tags: [],
  publishedAt: new Date().toISOString(),
  draft: true,
};

export default function BlogForm({ initial, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<BlogPost>(initial ?? EMPTY);
  const isNew = !initial;
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));

  const set = <K extends keyof BlogPost>(k: K, v: BlogPost[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      // Auto-generate id from title only when creating, and only if user
      // hasn't manually edited it yet.
      id: isNew && (!prev.id || prev.id === slugify(prev.title)) ? slugify(value) : prev.id,
    }));
  }

  // datetime-local needs YYYY-MM-DDTHH:mm (no Z, no seconds)
  const dtValue = (() => {
    const d = new Date(form.publishedAt);
    if (isNaN(d.getTime())) return nowLocalISO();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  function handleSave() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({
      ...form,
      tags,
      coverImage: form.coverImage?.trim() || undefined,
    });
  }

  return (
    <div
      className="glass"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
    >
      <h3 className="display" style={{ fontSize: 16, margin: 0 }}>
        {isNew ? "Nueva publicación" : `Editar — ${form.title || form.id}`}
      </h3>

      <AdminFormField label="Título">
        <input
          style={INPUT_STYLE}
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Resumen de la ronda 04"
        />
      </AdminFormField>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AdminFormField label="Slug (ID)">
          <input
            style={INPUT_STYLE}
            value={form.id}
            onChange={(e) => set("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            disabled={!isNew}
            placeholder="ronda-04-resumen"
          />
        </AdminFormField>
        <AdminFormField label="Autor">
          <input
            style={INPUT_STYLE}
            value={form.author ?? ""}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Nombre del autor"
          />
        </AdminFormField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AdminFormField label="Fecha de publicación">
          <input
            style={INPUT_STYLE}
            type="datetime-local"
            value={dtValue}
            onChange={(e) => {
              const next = e.target.value;
              if (!next) return;
              set("publishedAt", new Date(next).toISOString());
            }}
          />
        </AdminFormField>
        <AdminFormField label="Estado">
          <label style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 10px", border: "1px solid var(--border-hairline)", background: "var(--bg-surface)" }}>
            <input
              type="checkbox"
              checked={form.draft}
              onChange={(e) => set("draft", e.target.checked)}
            />
            <span style={{ fontSize: 13, color: form.draft ? "var(--status-warning)" : "var(--status-success)" }}>
              {form.draft ? "Borrador (no visible al público)" : "Publicado (visible al público)"}
            </span>
          </label>
        </AdminFormField>
      </div>

      <AdminFormField label="Imagen de portada (URL)">
        <input
          style={INPUT_STYLE}
          value={form.coverImage ?? ""}
          onChange={(e) => set("coverImage", e.target.value)}
          placeholder="/blog/cover.jpg ó https://..."
        />
      </AdminFormField>

      <AdminFormField label="Etiquetas (separadas por coma)">
        <input
          style={INPUT_STYLE}
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="resumen, ronda 04, pro"
        />
      </AdminFormField>

      <AdminFormField label="Extracto (1-2 frases que aparecen en la lista)">
        <textarea
          style={{ ...INPUT_STYLE, minHeight: 60, resize: "vertical" }}
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="Una breve descripción del artículo..."
        />
      </AdminFormField>

      <AdminFormField label="Cuerpo (texto · soporta # encabezado, **negrita**, *cursiva*, `código`, [enlace](url) — separa párrafos con línea en blanco)">
        <textarea
          style={{ ...INPUT_STYLE, minHeight: 280, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.55 }}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder={"# Título de sección\n\nPárrafo de introducción. Puedes usar **negrita**, *cursiva*, `código en línea` y [enlaces](https://ejemplo.com).\n\n## Subtítulo\n\nMás contenido aquí."}
        />
      </AdminFormField>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <AdminButton variant="secondary" onClick={onCancel}>
          Cancelar
        </AdminButton>
        <AdminButton onClick={handleSave} disabled={saving || !form.id || !form.title}>
          {saving ? "Guardando..." : "Guardar"}
        </AdminButton>
      </div>
    </div>
  );
}
