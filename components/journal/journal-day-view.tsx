"use client";

import { useState } from "react";
import { PageEditor } from "@/components/editor/page-editor";
import { JournalDayHeader } from "@/components/journal/journal-day-header";

type Props = {
  pageId: string;
  name: string;
  contentJson: Record<string, unknown>;
};

export function JournalDayView({ pageId, name, contentJson }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="nodra-journal-section group">
      <JournalDayHeader
        pageId={pageId}
        name={name}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      {!collapsed && (
        <PageEditor
          pageId={pageId}
          initialContent={contentJson}
          variant="journal"
        />
      )}
    </section>
  );
}
