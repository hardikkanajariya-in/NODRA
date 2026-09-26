"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmText?: string;
  matchText?: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  confirmText,
  matchText,
  danger = true,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");

  if (!open) return null;

  const needsMatch = Boolean(matchText);
  const canConfirm =
    !loading && (!needsMatch || typed.trim() === matchText?.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--nodra-border)] bg-[var(--nodra-main)] p-5 shadow-lg">
        <h2 id="confirm-dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-[var(--nodra-muted)]">{description}</div>
        {confirmText && (
          <p className="mt-3 text-sm text-[var(--nodra-fg)]">{confirmText}</p>
        )}
        {needsMatch && matchText && (
          <label className="mt-3 block text-sm">
            Type{" "}
            <code className="rounded bg-[var(--nodra-bg)] px-1 text-[12px]">
              {matchText}
            </code>{" "}
            to confirm
            <input
              className="nodra-input mt-1 w-full"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--nodra-border)] px-3 py-2 text-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              danger
                ? "rounded-lg bg-[var(--nodra-danger)] px-3 py-2 text-sm text-white disabled:opacity-50"
                : "nodra-btn-primary text-sm disabled:opacity-50"
            }
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
