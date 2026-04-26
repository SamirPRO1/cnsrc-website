"use client";

import Link from "next/link";
import { useQuery } from "@/lib/admin/use-api";
import type { Driver, Team, TrackRef } from "@/lib/types";

interface ChampSummary {
  id: string;
  name: string;
  season: string;
  year: number;
  status: string;
  rounds: number;
}

export default function AdminDashboard() {
  const { data: drivers } = useQuery<Driver[]>("/api/admin/drivers");
  const { data: teams } = useQuery<Team[]>("/api/admin/teams");
  const { data: tracks } = useQuery<TrackRef[]>("/api/admin/tracks");
  const { data: champs } = useQuery<ChampSummary[]>("/api/admin/championships");

  const stats = [
    {
      label: "Pilotos",
      value: drivers?.length ?? "...",
      href: "/admin/drivers",
      color: "var(--accent-red)",
    },
    {
      label: "Equipos",
      value: teams?.length ?? "...",
      href: "/admin/teams",
      color: "var(--status-warning)",
    },
    {
      label: "Circuitos",
      value: tracks?.length ?? "...",
      href: "/admin/tracks",
      color: "var(--status-success)",
    },
    {
      label: "Campeonatos",
      value: champs?.length ?? "...",
      href: "/admin/championships",
      color: "#8B5CF6",
    },
  ];

  const liveChamp = champs?.find((c) => c.status === "live");

  return (
    <div>
      <h1 className="display" style={{ fontSize: 28, marginBottom: 32 }}>
        Panel de Administracion
      </h1>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div
              className="glass"
              style={{
                padding: "20px 24px",
                borderLeft: `3px solid ${s.color}`,
                cursor: "pointer",
              }}
            >
              <div
                className="label"
                style={{ marginBottom: 8, fontSize: 11 }}
              >
                {s.label}
              </div>
              <div
                className="display"
                style={{ fontSize: 32, color: s.color }}
              >
                {s.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Active championship */}
      {liveChamp && (
        <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
          <div className="label" style={{ marginBottom: 8 }}>
            Campeonato activo
          </div>
          <Link
            href={`/admin/championships/${liveChamp.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="display" style={{ fontSize: 20, color: "var(--accent-red)" }}>
              {liveChamp.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4 }}>
              {liveChamp.season} &middot; {liveChamp.rounds} rondas
            </div>
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="glass" style={{ padding: 24 }}>
        <div className="label" style={{ marginBottom: 12 }}>
          Acceso rapido
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { href: "/admin/drivers", label: "Gestionar pilotos" },
            { href: "/admin/teams", label: "Gestionar equipos" },
            { href: "/admin/tracks", label: "Gestionar circuitos" },
            { href: "/admin/championships", label: "Gestionar campeonatos" },
            { href: "/", label: "Ver sitio publico" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                textDecoration: "none",
                padding: "8px 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-hairline)",
                transition: "all 150ms",
              }}
            >
              {link.label} &rarr;
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
