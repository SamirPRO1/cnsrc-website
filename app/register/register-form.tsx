"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Glass } from "@/components/ui/glass";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numInt = parseInt(number, 10);
    if (isNaN(numInt) || numInt < 1 || numInt > 999) {
      setError("El número debe ser un entero entre 1 y 999.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("number", String(numInt));
      if (selectedFile) form.append("picture", selectedFile);

      const res = await fetch("/api/register", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Error al registrar.");
      } else {
        router.push("/admin/profile");
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Glass cut={18} heavy stripe pad={40} style={{ maxWidth: 480, width: "100%" }} className="fx-shine fx-shine--auto fx-glow-red">
      <div className="display" style={{ fontSize: 26, color: "var(--accent-red)", marginBottom: 4 }}>
        CNSRC
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>
        Completa tu perfil de piloto para continuar.
      </div>

      {error && (
        <div style={{
          background: "rgba(220,50,50,0.1)",
          border: "1px solid rgba(220,50,50,0.3)",
          borderRadius: 6,
          padding: "10px 14px",
          fontSize: 13,
          color: "var(--accent-red)",
          fontFamily: "var(--font-body)",
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Name */}
        <div>
          <div className="label" style={{ marginBottom: 6 }}>NOMBRE COMPLETO *</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={60}
            placeholder="Tu nombre como piloto"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg-surface-p1)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              borderRadius: 4,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Number */}
        <div>
          <div className="label" style={{ marginBottom: 6 }}>NÚMERO DE PILOTO * (1–999)</div>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            min={1}
            max={999}
            placeholder="Ej: 44"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg-surface-p1)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: 20,
              borderRadius: 4,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Picture */}
        <div>
          <div className="label" style={{ marginBottom: 8 }}>FOTO DE PERFIL (opcional)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 72,
              height: 72,
              background: "var(--bg-surface-p1)",
              border: "1px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {previewUrl ? (
                <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>Sin foto</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: "7px 14px",
                  background: "var(--bg-surface-p1)",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                Elegir foto
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" style={{ display: "none" }} onChange={handleFileChange} />
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-body)", marginTop: 5 }}>
                JPG, PNG, WebP o AVIF
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: saving ? "var(--bg-surface-p1)" : "var(--accent-red)",
            border: "none",
            color: saving ? "var(--text-secondary)" : "#fff",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            borderRadius: 4,
            marginTop: 4,
          }}
        >
          {saving ? "Registrando…" : "Crear perfil y continuar"}
        </button>
      </form>
    </Glass>
  );
}
