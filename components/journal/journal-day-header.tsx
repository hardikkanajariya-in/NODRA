"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { JournalSectionActions } from "@/components/journal/journal-section-actions";
import { dispatchPagesChanged } from "@/lib/realtime/client";

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
        dispatchPagesChanged({ catalogRevision: `local-${Date.now()}` });
        router.push("/journal");
        router.refresh();
      }
    } finally {
      setBusy(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <div className="nodra-journal-section-head group mb-1 flex items-center gap-1">
        {onToggleCollapse && (
          <button
            type="button"
            className="nodra-icon-btn shrink-0"
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
        <JournalSectionActions
          pageId={pageId}
          showOutlineControls={!collapsed}
          onDelete={() => setDeleteOpen(true)}
          deleteAriaLabel="Delete journal"
        />
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
