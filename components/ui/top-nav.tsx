"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Campeonatos", href: "/championships" },
  { label: "Pilotos",     href: "/drivers" },
  { label: "Circuitos",   href: "/tracks" },
  { label: "Récords",     href: "/records" },
] as const;

export function TopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("/")[1] ? `/${href.split("/")[1]}` : href);
  }

  return (
    <nav className="topnav">
      <Link href="/" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Image src="/sponsors/cnsrc.png" alt="CNSRC" width={120} height={32} style={{ objectFit: "contain", width: "auto", height: 32 }} />
          <div
            className="label"
            style={{ color: "var(--text-tertiary)", fontSize: 10, letterSpacing: "0.24em" }}
          >
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
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "var(--accent-red)",
                    }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        <span
          className="label"
          style={{ color: "var(--text-tertiary)", fontSize: 12, letterSpacing: "0.2em" }}
        >
          ⌕ BUSCAR
        </span>
      </div>
    </nav>
  );
}
