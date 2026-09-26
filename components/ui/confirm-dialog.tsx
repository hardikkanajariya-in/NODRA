"use client";

import { useEffect, useState } from "react";

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
  onConfirm: () => void | Promise<void>;
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
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      setTyped("");
      setConfirming(false);
    }
  }, [open]);

  if (!open) return null;

  const needsMatch = Boolean(matchText);
  const busy = loading || confirming;
  const canConfirm =
    !busy && (!needsMatch || typed.trim() === matchText?.trim());

  async function handleConfirm() {
    if (!canConfirm) return;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  function handleCancel() {
    if (busy) return;
    setTyped("");
    onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--nodra-border)] bg-[var(--nodra-main)] p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
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
              disabled={busy}
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--nodra-border)] px-3 py-2 text-sm"
            onClick={handleCancel}
            disabled={busy}
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
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
