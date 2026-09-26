"use client";

import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageEditor } from "@/components/editor/page-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { dispatchPagesChanged } from "@/lib/realtime/client";

type Props = {
  entry: {
    id: string;
    slug: string;
    name: string;
    contentJson: Record<string, unknown>;
  };
  defaultCollapsed?: boolean;
  showDivider?: boolean;
};

export function JournalFeedSection({
  entry,
  defaultCollapsed = false,
  showDivider = false,
}: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [title, setTitle] = useState(entry.name);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(entry.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveTitle() {
    setEditingTitle(false);
    const next = titleDraft.trim();
    if (!next || next === title) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pages/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      if (res.ok) {
        setTitle(next);
        router.refresh();
      } else {
        setTitleDraft(title);
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/pages/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        dispatchPagesChanged({ catalogRevision: `local-${Date.now()}` });
        router.refresh();
      }
    } finally {
      setBusy(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <section
        id={`journal-${entry.slug}`}
        className="nodra-journal-section group"
      >
        <div className="nodra-journal-section-head sticky top-0 z-10 flex items-start gap-0.5 bg-[var(--nodra-main)] py-1.5">
          <button
            type="button"
            className="nodra-icon-btn mt-0.5 shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand journal" : "Collapse journal"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <input
                className="nodra-journal-date nodra-title-input w-full border-0 bg-transparent p-0"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void saveTitle()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveTitle();
                  if (e.key === "Escape") {
                    setTitleDraft(title);
                    setEditingTitle(false);
                  }
                }}
                disabled={busy}
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="nodra-journal-date block w-full text-left hover:opacity-80"
                onClick={() => {
                  setTitleDraft(title);
                  setEditingTitle(true);
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
            aria-label={`Delete journal ${title}`}
            title="Delete journal"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {!collapsed && (
          <PageEditor
            pageId={entry.id}
            initialContent={entry.contentJson}
            variant="journal"
          />
        )}

        {showDivider && <hr className="nodra-journal-divider" />}
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this journal?"
        description={
          <>
            Permanently deletes this journal page, its document, links, and
            uploaded images. This cannot be undone.
          </>
        }
        confirmLabel="Delete journal"
        loading={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
