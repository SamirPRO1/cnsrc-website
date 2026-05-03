import type { Metadata } from "next";
import { Inter, Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ui/effects/ScrollProgress";

const inter = Inter({
  variable: "--font-body-loaded",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-display-loaded",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-loaded",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CNSRC — Campeonato Nacional Simracing Cuba",
  description: "Official results, standings and lap data for the Cuban sim-racing championship on Assetto Corsa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable}`}
      style={{
        // Wire loaded fonts into the design-token stack
        ["--font-display" as string]: `var(--font-display-loaded), "Bebas Neue", sans-serif`,
        ["--font-body" as string]: `var(--font-body-loaded), system-ui, sans-serif`,
        ["--font-mono" as string]: `var(--font-mono-loaded), ui-monospace, monospace`,
      }}
    >
      <body style={{ minHeight: "100vh" }}>
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
