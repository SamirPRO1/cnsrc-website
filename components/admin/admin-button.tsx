"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--accent-red)",
    color: "#fff",
    border: "1px solid var(--accent-red)",
  },
  secondary: {
    background: "var(--bg-surface)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-hairline)",
  },
  danger: {
    background: "transparent",
    color: "var(--status-danger)",
    border: "1px solid var(--status-danger)",
  },
};

export default function AdminButton({
  variant = "primary",
  style,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...STYLES[variant],
        padding: "8px 16px",
        fontSize: 13,
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 150ms",
        ...style,
      }}
    />
  );
}
