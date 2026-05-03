"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  isAdmin: boolean;
  driverId: string | null;
  driverName: string | null;
}

const ADMIN_NAV = [
  { href: "/admin", label: "Panel", icon: "grid" },
  { href: "/admin/drivers", label: "Pilotos", icon: "users" },
  { href: "/admin/teams", label: "Equipos", icon: "flag" },
  { href: "/admin/tracks", label: "Circuitos", icon: "map" },
  { href: "/admin/championships", label: "Campeonatos", icon: "trophy" },
  { href: "/admin/blog", label: "Blog", icon: "post" },
] as const;

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  flag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  trophy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  post: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
};

export default function AdminSidebar({ isAdmin, driverId, driverName }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = isAdmin ? ADMIN_NAV : [];

  return (
    <aside
      className="glass"
      style={{
        width: 220,
        minHeight: "100vh",
        padding: "24px 0",
        borderRight: "1px solid var(--border-hairline)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <div
        className="display"
        style={{
          padding: "0 20px 20px",
          fontSize: 18,
          color: "var(--accent-red)",
          borderBottom: "1px solid var(--border-hairline)",
          marginBottom: 8,
        }}
      >
        CNSRC Admin
      </div>

      {navItems.map(({ href, label, icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              color: active ? "var(--accent-red)" : "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              background: active ? "var(--bg-surface-p1)" : "transparent",
              borderLeft: active
                ? "3px solid var(--accent-red)"
                : "3px solid transparent",
              transition: "all 150ms ease",
            }}
          >
            {ICONS[icon]}
            {label}
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Profile link — only if user is a driver */}
      {driverId && (
        <Link
          href="/admin/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            color:
              pathname === "/admin/profile"
                ? "var(--accent-red)"
                : "var(--text-secondary)",
            textDecoration: "none",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            borderTop: "1px solid var(--border-hairline)",
            background:
              pathname === "/admin/profile" ? "var(--bg-surface-p1)" : "transparent",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {driverName ?? "Mi Perfil"}
        </Link>
      )}

      {/* Logged-in user info + logout */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border-hairline)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-body)",
            lineHeight: 1.4,
          }}
        >
          {isAdmin && (
            <span style={{ color: "var(--accent-red)", fontWeight: 600 }}>Admin</span>
          )}
          {isAdmin && driverName && " · "}
          {driverName ?? (isAdmin ? "" : "Piloto")}
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            fontSize: 12,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>

      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          color: "var(--text-tertiary)",
          textDecoration: "none",
          fontSize: 12,
          fontFamily: "var(--font-body)",
        }}
      >
        &larr; Volver al sitio
      </Link>
    </aside>
  );
}
