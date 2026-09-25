export function EditorSkeleton() {
  return (
    <div className="nodra-editor-skeleton space-y-3 py-2" aria-hidden>
      <div className="flex gap-2">
        <span className="nodra-skeleton-bullet" />
        <span className="nodra-skeleton-line w-3/4" />
      </div>
      <div className="flex gap-2 pl-6">
        <span className="nodra-skeleton-bullet" />
        <span className="nodra-skeleton-line w-1/2" />
      </div>
      <div className="flex gap-2">
        <span className="nodra-skeleton-bullet" />
        <span className="nodra-skeleton-line w-2/3" />
      </div>
    </div>
  );
}
