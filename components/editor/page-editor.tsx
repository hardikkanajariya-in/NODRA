"use client";

import dynamic from "next/dynamic";

const LogseqEditor = dynamic(
  () =>
    import("./logseq-editor").then((m) => ({ default: m.LogseqEditor })),
  { ssr: false },
);

type Props = {
  pageId: string;
  initialContent: Record<string, unknown>;
};

export function PageEditor({ pageId, initialContent }: Props) {
  return <LogseqEditor pageId={pageId} initialContent={initialContent} />;
}
