"use client";

import Link from "next/link";
import { useQuery } from "@/lib/admin/use-api";

interface ChampSummary {
  id: string;
  name: string;
  season: string;
  year: number;
  status: string;
  rounds: number;
}

const STATUS_COLORS: Record<string, string> = {
  live: "var(--accent-red)",
  complete: "var(--status-success)",
  upcoming: "var(--status-warning)",
};

export default function ChampionshipsAdminPage() {
  const { data: champs, loading } = useQuery<ChampSummary[]>("/api/admin/championships");

  return (
    <div>
      <h1 className="display" style={{ fontSize: 28, marginBottom: 24 }}>
        Campeonatos
      </h1>

      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>Cargando...</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {champs?.map((c) => (
            <Link
              key={c.id}
              href={`/admin/championships/${c.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className="glass"
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div className="display" style={{ fontSize: 18 }}>
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-tertiary)",
                      marginTop: 4,
                    }}
                  >
                    {c.season} &middot; {c.year} &middot; {c.rounds} rondas
                  </div>
                </div>
                <span
                  className="chip"
                  style={{
                    color: STATUS_COLORS[c.status] ?? "var(--text-tertiary)",
                    borderColor: STATUS_COLORS[c.status] ?? "var(--border-hairline)",
                  }}
                >
                  {c.status.toUpperCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
