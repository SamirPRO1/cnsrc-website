"use client";

import { useEffect, useRef } from "react";
import AdminButton from "./admin-button";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminDialog({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        margin: "auto",
        background: "#18181B",
        border: "1px solid var(--border-hairline)",
        color: "var(--text-primary)",
        padding: 32,
        maxWidth: 420,
        width: "90vw",
        zIndex: 1000,
      }}
    >
      <h3
        className="display"
        style={{ fontSize: 18, marginBottom: 12 }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <AdminButton variant="secondary" onClick={onCancel}>
          Cancelar
        </AdminButton>
        <AdminButton variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </AdminButton>
      </div>
    </dialog>
  );
}
