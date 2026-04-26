"use client";

interface Props {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export default function AdminFormField({ label, error, children }: Props) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 13,
        color: "var(--text-secondary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: 11,
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      {children}
      {error && (
        <span style={{ color: "var(--status-danger)", fontSize: 11 }}>
          {error}
        </span>
      )}
    </label>
  );
}

/* Shared input style for consistency */
export const INPUT_STYLE: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-hairline)",
  color: "var(--text-primary)",
  padding: "8px 10px",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
};

export const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  cursor: "pointer",
};
