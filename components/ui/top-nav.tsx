"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { label: "Campeonatos", href: "/championships" },
  { label: "Pilotos",     href: "/drivers" },
  { label: "Circuitos",   href: "/tracks" },
  { label: "Récords",     href: "/records" },
  { label: "Blog",        href: "/blog" },
] as const;

interface AuthState {
  driverId: string | null;
  driverName: string | null;
  driverNumber: string | null;
  isAdmin: boolean;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null | "loading">("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setAuth(data))
      .catch(() => setAuth(null));
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth(null);
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("/")[1] ? `/${href.split("/")[1]}` : href);
  }

  const isLoggedIn = auth && auth !== "loading";

  return (
    <nav className="topnav">
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Image src="/sponsors/cnsrc.png" alt="CNSRC" width={120} height={32} style={{ objectFit: "contain", width: "auto", height: 32 }} />
          <div className="label" style={{ color: "var(--text-tertiary)", fontSize: 10, letterSpacing: "0.24em" }}>
            CAMPEONATO NACIONAL · SIMRACING CUBA
          </div>
        </div>
      </Link>

      <ul className="topnav-links">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  paddingBottom: 6,
                  position: "relative",
                  display: "inline-block",
                }}
              >
                {item.label}
                {active && (
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "var(--accent-red)" }} />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Auth area */}
        {auth === "loading" ? (
          <div style={{ width: 80, height: 28 }} />
        ) : !isLoggedIn ? (
          <a
            href="/api/auth/steam"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              background: "#1b2838",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: "#c7d5e0",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "background 150ms ease",
            }}
          >
            <SteamIcon size={14} />
            Iniciar sesión
          </a>
        ) : (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px",
                background: menuOpen ? "var(--bg-surface-hover)" : "var(--bg-surface)",
                border: "1px solid var(--border-hairline)",
                borderRadius: 4,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {auth.driverNumber && (
                <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--accent-red)", fontVariantNumeric: "tabular-nums" }}>
                  #{auth.driverNumber}
                </span>
              )}
              <span>{auth.driverName ?? (auth.isAdmin ? "Admin" : "Piloto")}</span>
              <ChevronIcon open={menuOpen} />
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 6px)",
                minWidth: 180,
                background: "#0f0f12",
                border: "1px solid var(--border-hairline)",
                borderRadius: 6,
                overflow: "hidden",
                zIndex: 100,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                {auth.driverId && (
                  <MenuLink href="/admin/profile" onClick={() => setMenuOpen(false)}>
                    Mi Perfil
                  </MenuLink>
                )}
                {auth.isAdmin && (
                  <MenuLink href="/admin" onClick={() => setMenuOpen(false)}>
                    Panel Admin
                  </MenuLink>
                )}
                {auth.driverId && (
                  <MenuLink href={`/drivers/${auth.driverId}`} onClick={() => setMenuOpen(false)}>
                    Ver perfil público
                  </MenuLink>
                )}
                <div style={{ borderTop: "1px solid var(--border-hairline)" }} />
                <button
                  onClick={handleLogout}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block",
        padding: "10px 16px",
        color: "var(--text-secondary)",
        textDecoration: "none",
        fontFamily: "var(--font-body)",
        fontSize: 13,
      }}
    >
      {children}
    </Link>
  );
}

function SteamIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.38-1.385c-.624-.26-1.29-.249-1.878-.03l1.522.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.451 1.014zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
