import Link from "next/link";
import { Glass } from "@/components/ui/glass";
import { ParallaxBackdrop } from "@/components/ui/effects/ParallaxBackdrop";
import { Reveal } from "@/components/ui/effects/Reveal";
import { TextScramble } from "@/components/ui/effects/TextScramble";

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
    <ParallaxBackdrop
      orbs={[
        { color: "red",    x: -60, y: -40, w: 380, h: 380, opacity: 0.6, depth: 0.8 },
        { color: "purple", x: 720, y: 320, w: 320, h: 320, opacity: 0.45, depth: 0.5 },
      ]}
      speedLines
      bracketCorners
    >
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Reveal variant="scale">
        <Glass cut={18} heavy stripe pad={40} style={{ maxWidth: 400, width: "100%" }} className="fx-shine fx-shine--auto fx-glow-red">
          <div className="display fx-text-gradient" style={{ fontSize: 26, marginBottom: 4 }}>
            <TextScramble text="CNSRC" duration={700} />
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
            className="fx-link-underline fx-press"
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
              transition: "background 200ms ease, color 200ms ease",
            }}
          >
            ← Volver al inicio
          </Link>
        </Glass>
        </Reveal>
      </div>
    </ParallaxBackdrop>
  );
}
