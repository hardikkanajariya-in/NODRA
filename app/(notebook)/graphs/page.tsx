import Link from "next/link";
import { listGraphs, getActiveGraph } from "@/lib/graphs/service";
import { ConnectionError } from "@/components/errors/connection-error";
import { getErrorMessage } from "@/lib/pages/document";
import { GraphSwitchButton } from "@/components/shell/graph-switch-button";

export const dynamic = "force-dynamic";

export default async function AllGraphsPage() {
  try {
    const graphs = await listGraphs();
    const active = await getActiveGraph();

    return (
      <div className="nodra-content mx-auto max-w-2xl px-8 py-6">
        <h1 className="nodra-page-title mb-4">All graphs</h1>
        <p className="mb-6 text-sm text-[var(--nodra-muted)]">
          Each graph is an isolated notebook: its own journals, pages, and
          links.
        </p>
        <ul className="space-y-2">
          {graphs.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded-md border border-[var(--nodra-border)] px-3 py-2"
            >
              <span className="font-medium">{g.name}</span>
              <div className="flex items-center gap-2">
                {g.id === active.id && (
                  <span className="text-xs text-[var(--nodra-muted)]">
                    Active
                  </span>
                )}
                {g.id !== active.id && (
                  <GraphSwitchButton graphId={g.id} label="Open" />
                )}
                <Link
                  href="/journal"
                  className="text-sm text-[var(--nodra-link)]"
                >
                  Journals
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }
}
