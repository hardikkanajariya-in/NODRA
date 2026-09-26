"use client";

import { dispatchJournalOutlineSetCollapsed } from "@/lib/editor/journal-outline-controls";

type Props = {
  pageId: string;
};

export function JournalOutlineToolbar({ pageId }: Props) {
  return (
    <div className="nodra-journal-outline-toolbar">
      <button
        type="button"
        className="nodra-journal-outline-toolbar-btn"
        onClick={() =>
          dispatchJournalOutlineSetCollapsed({ pageId, collapsed: false })
        }
      >
        Expand all
      </button>
      <span className="nodra-journal-outline-toolbar-sep" aria-hidden>
        ·
      </span>
      <button
        type="button"
        className="nodra-journal-outline-toolbar-btn"
        onClick={() =>
          dispatchJournalOutlineSetCollapsed({ pageId, collapsed: true })
        }
      >
        Collapse all
      </button>
    </div>
  );
}
