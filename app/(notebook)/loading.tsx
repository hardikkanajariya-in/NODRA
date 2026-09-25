import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function NotebookLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner label="Loading…" />
    </div>
  );
}
