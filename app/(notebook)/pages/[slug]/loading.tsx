import { EditorSkeleton } from "@/components/ui/editor-skeleton";

export default function PageLoading() {
  return (
    <div className="nodra-content mx-auto max-w-3xl px-6 py-6 md:px-10">
      <div className="nodra-skeleton-line mb-6 h-9 w-2/3 max-w-md" />
      <EditorSkeleton />
    </div>
  );
}
