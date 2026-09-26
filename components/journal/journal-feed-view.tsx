"use client";

import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import {
  JournalFeedSection,
} from "@/components/journal/journal-feed-section";

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
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    const el = document.getElementById(`journal-${today}`);
    if (el) {
      el.scrollIntoView({ block: "start" });
    }
  }, [entries, today]);

  return (
    <div className="nodra-journal-feed nodra-journal-feed--scroll nodra-main-content py-3">
      {entries.map((entry, index) => (
        <JournalFeedSection
          key={entry.id}
          entry={entry}
          defaultCollapsed={entry.slug !== today}
          showDivider={index < entries.length - 1}
        />
      ))}
    </div>
  );
}
