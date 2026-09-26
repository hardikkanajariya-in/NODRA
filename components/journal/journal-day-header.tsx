"use client";

import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  pageId: string;
  name: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function JournalDayHeader({
  pageId,
  name,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveTitle() {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === title) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (res.ok) {
        setTitle(next);
        router.refresh();
      } else {
        setDraft(title);
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteOpen(false);
        router.push("/journal");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="nodra-journal-section-head group mb-2 flex items-start gap-1">
        {onToggleCollapse && (
          <button
            type="button"
            className="nodra-icon-btn mt-1 shrink-0"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              className="nodra-journal-date nodra-title-input w-full border-0 bg-transparent p-0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => void saveTitle()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveTitle();
                if (e.key === "Escape") {
                  setDraft(title);
                  setEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="nodra-journal-date block w-full text-left hover:opacity-80"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
            >
              {title}
            </button>
          )}
        </div>
        <button
          type="button"
          className="nodra-icon-btn shrink-0 text-[var(--nodra-danger)] opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          onClick={() => setDeleteOpen(true)}
          aria-label="Delete journal"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this journal?"
        description="Permanently deletes this journal and all of its content and assets."
        confirmLabel="Delete journal"
        loading={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
