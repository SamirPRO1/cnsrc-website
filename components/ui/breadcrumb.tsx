import Link from "next/link";

type BreadcrumbItem = string | { label: string; href?: string };

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 14px" }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const label = typeof item === "string" ? item : item.label;
        const href  = typeof item === "string" ? undefined : item.href;

        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {href && !isLast ? (
              <Link
                href={href}
                className="label"
                style={{ fontSize: 12, color: "var(--text-tertiary)", textDecoration: "none" }}
              >
                {label}
              </Link>
            ) : (
              <span
                className="label"
                style={{ fontSize: 12, color: isLast ? "var(--text-primary)" : "var(--text-tertiary)" }}
              >
                {label}
              </span>
            )}
            {!isLast && (
              <span style={{ color: "var(--text-tertiary)", opacity: 0.4, fontSize: 12 }}>/</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
