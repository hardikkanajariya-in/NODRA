"use client";

import { useEffect } from "react";
import { PageEditor } from "@/components/editor/page-editor";

export type JournalFeedEntry = {
  id: string;
  slug: string;
  name: string;
  contentJson: Record<string, unknown>;
};

type Props = {
  entries: JournalFeedEntry[];
};

export function JournalFeedView({ entries }: Props) {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const el = document.getElementById(`journal-${today}`);
    if (el) {
      el.scrollIntoView({ block: "start" });
    }
  }, [entries]);

  return (
    <div className="nodra-journal-feed nodra-journal-feed--scroll mx-auto max-w-3xl px-6 py-3 md:px-10">
      {entries.map((entry, index) => (
        <section
          key={entry.id}
          id={`journal-${entry.slug}`}
          className="nodra-journal-section"
        >
          <h2 className="nodra-journal-date sticky top-0 z-10 bg-[var(--nodra-main)] py-2">
            {entry.name}
          </h2>
          <PageEditor
            pageId={entry.id}
            initialContent={entry.contentJson}
            variant="journal"
          />
          {index < entries.length - 1 && (
            <hr className="nodra-journal-divider" />
          )}
        </section>
      ))}
    </div>
  );
}
