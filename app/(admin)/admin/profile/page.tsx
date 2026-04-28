"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface DriverData {
  id: string;
  name: string;
  picture?: string;
  description?: string;
}

export default function ProfilePage() {
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile/me")
      .then((r) => r.json())
      .then((d: DriverData) => {
        setDriver(d);
        setDescription(d.description ?? "");
      })
      .catch(() => setMessage({ type: "err", text: "No se pudo cargar el perfil." }));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("description", description);
      if (selectedFile) form.append("picture", selectedFile);

      const res = await fetch("/api/profile", { method: "PUT", body: form });
      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "err", text: err.error ?? "Error al guardar." });
      } else {
        const updated: DriverData = await res.json();
        setDriver(updated);
        setDescription(updated.description ?? "");
        setSelectedFile(null);
        setPreviewUrl(null);
        setMessage({ type: "ok", text: "Perfil actualizado correctamente." });
      }
    } catch {
      setMessage({ type: "err", text: "Error de conexión." });
    } finally {
      setSaving(false);
    }
  }

  const currentPicture = previewUrl ?? driver?.picture;

  return (
    <div style={{ maxWidth: 560 }}>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--text-tertiary)",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        ← Inicio
      </Link>
      <h1
        className="display"
        style={{ fontSize: 28, marginBottom: 4, color: "var(--text-primary)" }}
      >
        Mi Perfil
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 32,
        }}
      >
        Edita tu descripción y foto de piloto que aparecen en el sitio.
      </p>

      {message && (
        <div
          style={{
            background:
              message.type === "ok" ? "rgba(50,200,100,0.1)" : "rgba(220,50,50,0.1)",
            border: `1px solid ${message.type === "ok" ? "rgba(50,200,100,0.3)" : "rgba(220,50,50,0.3)"}`,
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 13,
            color: message.type === "ok" ? "#3cb370" : "var(--accent-red)",
            fontFamily: "var(--font-body)",
            marginBottom: 24,
          }}
        >
          {message.text}
        </div>
      )}

      {driver ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Picture */}
          <div>
            <div className="label" style={{ marginBottom: 10 }}>
              FOTO DE PERFIL
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  background: "var(--bg-surface-p1)",
                  border: "1px solid var(--border-hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {currentPicture ? (
                  <img
                    src={currentPicture}
                    alt={driver.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>Sin foto</span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    padding: "8px 16px",
                    background: "var(--bg-surface-p1)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  Cambiar foto
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                    marginTop: 6,
                  }}
                >
                  JPG, PNG, WebP o AVIF
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="label" style={{ marginBottom: 8 }}>
              DESCRIPCIÓN
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={600}
              placeholder="Cuéntanos algo sobre ti como piloto…"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-surface-p1)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                resize: "vertical",
                borderRadius: 4,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {description.length}/600
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              alignSelf: "flex-start",
              padding: "10px 24px",
              background: saving ? "var(--bg-surface-p1)" : "var(--accent-red)",
              border: "none",
              color: saving ? "var(--text-secondary)" : "#fff",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              borderRadius: 4,
              transition: "background 150ms ease",
            }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      ) : (
        <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 14 }}>
          Cargando…
        </div>
      )}
    </div>
  );
}
