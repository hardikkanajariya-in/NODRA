"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "@/components/ui/editor-skeleton";

const LogseqEditor = dynamic(
  () =>
    import("./logseq-editor").then((m) => ({ default: m.LogseqEditor })),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

type Props = {
  pageId: string;
  initialContent: Record<string, unknown>;
  variant?: "page" | "journal";
};

export function PageEditor({ pageId, initialContent, variant }: Props) {
  return (
    <LogseqEditor
      pageId={pageId}
      initialContent={initialContent}
      variant={variant}
    />
  );
}
