import { EditorSkeleton } from "@/components/ui/editor-skeleton";

export default function JournalLoading() {
  return (
    <div className="nodra-journal-feed mx-auto max-w-3xl px-6 py-4 md:px-10">
      <div className="nodra-skeleton-line mb-4 h-8 w-48" />
      <EditorSkeleton />
    </div>
  );
}
