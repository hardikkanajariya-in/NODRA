"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GraphSwitchButton } from "@/components/shell/graph-switch-button";

type Props = {
  graphId: string;
  name: string;
  isOwner: boolean;
  isActive: boolean;
};

export function GraphManageControls({
  graphId,
  name,
  isOwner,
  isActive,
}: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function saveName() {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === displayName) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/graphs/${graphId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not rename");
        setDraft(displayName);
        return;
      }
      setDisplayName(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/graphs/${graphId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete graph");
        return;
      }
      router.push("/graphs");
      router.refresh();
    } finally {
      setBusy(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing && isOwner ? (
            <input
              className="nodra-input w-full font-medium"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => void saveName()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveName();
                if (e.key === "Escape") {
                  setDraft(displayName);
                  setEditing(false);
                }
              }}
              disabled={busy}
              autoFocus
            />
          ) : (
            <span className="font-medium">{displayName}</span>
          )}
          {error && (
            <p className="mt-1 text-xs text-[var(--nodra-danger)]">{error}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isOwner && !editing && (
            <>
              <button
                type="button"
                className="text-xs text-[var(--nodra-link)]"
                onClick={() => {
                  setDraft(displayName);
                  setEditing(true);
                }}
                disabled={busy}
              >
                Rename
              </button>
              <button
                type="button"
                className="text-xs text-[var(--nodra-danger)]"
                onClick={() => setDeleteOpen(true)}
                disabled={busy}
              >
                Delete
              </button>
            </>
          )}
          {isActive && (
            <span className="text-xs text-[var(--nodra-muted)]">Active</span>
          )}
          {!isActive && (
            <GraphSwitchButton graphId={graphId} label="Open" />
          )}
          <Link href="/journal" className="text-sm text-[var(--nodra-link)]">
            Journals
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete graph permanently?"
        description={
          <>
            This removes the graph, all its pages, journals, documents, links,
            and uploaded assets from the database and storage. This cannot be
            undone.
          </>
        }
        confirmText={`Graph: ${displayName}`}
        matchText={displayName}
        confirmLabel="Delete graph forever"
        loading={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
