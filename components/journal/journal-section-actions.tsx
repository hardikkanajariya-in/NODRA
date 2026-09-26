"use client";

import { Trash2 } from "lucide-react";
import { JournalOutlineToolbar } from "@/components/journal/journal-outline-toolbar";

type Props = {
  pageId: string;
  showOutlineControls?: boolean;
  onDelete: () => void;
  deleteAriaLabel: string;
};

export function JournalSectionActions({
  pageId,
  showOutlineControls = true,
  onDelete,
  deleteAriaLabel,
}: Props) {
  return (
    <div className="nodra-journal-section-actions">
      {showOutlineControls ? (
        <JournalOutlineToolbar pageId={pageId} />
      ) : null}
      <button
        type="button"
        className="nodra-icon-btn nodra-journal-section-delete shrink-0 text-[var(--nodra-danger)]"
        onClick={onDelete}
        aria-label={deleteAriaLabel}
        title="Delete journal"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
