"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo } from "react";
import {
  JournalFeedSection,
} from "@/components/journal/journal-feed-section";
import { JournalFeedToolbar } from "@/components/journal/journal-feed-toolbar";

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

  const scrollToToday = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = document.getElementById(`journal-${today}`);
    if (el) {
      el.scrollIntoView({ block: "start", behavior });
      return;
    }
    window.scrollTo({ top: 0, behavior });
  }, [today]);

  useEffect(() => {
    scrollToToday("instant");
  }, [entries, scrollToToday, today]);

  return (
    <div className="nodra-journal-feed nodra-journal-feed--scroll nodra-main-content py-3">
      <JournalFeedToolbar onGoToToday={() => scrollToToday("smooth")} />
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
