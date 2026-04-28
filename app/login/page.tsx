import Link from "next/link";
import { Backdrop } from "@/components/ui/backdrop";
import { Glass } from "@/components/ui/glass";

export const metadata = { title: "Acceso — CNSRC" };

const ERROR_MESSAGES: Record<string, string> = {
  "steam-failed": "La verificación con Steam falló. Inténtalo de nuevo.",
  "not-authorized": "Tu cuenta no tiene acceso al panel de administración.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Backdrop orbs={[{ color: "red", x: -60, y: -40, w: 380, h: 380, opacity: 0.6 }]}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Glass cut={18} heavy stripe pad={40} style={{ maxWidth: 400, width: "100%" }}>
          <div className="display" style={{ fontSize: 26, color: "var(--accent-red)", marginBottom: 4 }}>
            CNSRC
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
              marginTop: 12,
            }}>
              {ERROR_MESSAGES[error] ?? "Error desconocido."}
            </div>
          )}

          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
            Inicia sesión con Steam usando el botón en la barra de navegación del sitio.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "var(--bg-surface-p1)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 4,
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              fontSize: 13,
            }}
          >
            ← Volver al inicio
          </Link>
        </Glass>
      </div>
    </Backdrop>
  );
}
