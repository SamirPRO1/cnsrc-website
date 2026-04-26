"use client";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export default function AdminDataTable<T>({
  columns,
  rows,
  keyFn,
  onEdit,
  onDelete,
}: Props<T>) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          fontFamily: "var(--font-body)",
        }}
      >
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border-hairline)",
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontWeight: 400,
                  width: c.width,
                }}
              >
                {c.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th
                style={{
                  textAlign: "right",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border-hairline)",
                  width: 120,
                }}
              />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyFn(row)}
              style={{
                borderBottom: "1px solid var(--border-hairline)",
                transition: "background 100ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: "10px 12px",
                    color: "var(--text-primary)",
                  }}
                >
                  {c.render(row)}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--status-danger)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: 13,
                }}
              >
                Sin datos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
