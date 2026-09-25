import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function GraphLoading() {
  return (
    <div className="flex h-[calc(100vh-2.5rem)] items-center justify-center">
      <LoadingSpinner label="Loading graph…" />
    </div>
  );
}
