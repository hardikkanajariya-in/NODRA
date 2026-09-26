import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { isGraphOwner } from "@/lib/graphs/access";
import { listGraphShares } from "@/lib/graphs/shares";
import { listGraphs, getActiveGraph } from "@/lib/graphs/service";
import { ConnectionError } from "@/components/errors/connection-error";
import { getErrorMessage } from "@/lib/pages/document";
import { GraphSwitchButton } from "@/components/shell/graph-switch-button";
import { GraphSharePanel } from "@/components/graphs/graph-share-panel";

export const dynamic = "force-dynamic";

export default async function AllGraphsPage() {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const graphs = await listGraphs(session.userId);
    const active = await getActiveGraph(session.userId);

    const ownership = await Promise.all(
      graphs.map(async (g) => ({
        id: g.id,
        isOwner: await isGraphOwner(session.userId, g.id),
      })),
    );
    const ownerById = new Map(ownership.map((o) => [o.id, o.isOwner]));

    const sharesByGraph = new Map<
      string,
      { id: string; userId: string; username: string }[]
    >();
    await Promise.all(
      graphs.map(async (g) => {
        if (!ownerById.get(g.id)) {
          sharesByGraph.set(g.id, []);
          return;
        }
        const rows = await listGraphShares(g.id, session.userId);
        sharesByGraph.set(g.id, rows ?? []);
      }),
    );

    return (
      <div className="nodra-content mx-auto max-w-2xl px-8 py-6">
        <h1 className="nodra-page-title mb-4">All graphs</h1>
        <p className="mb-6 text-sm text-[var(--nodra-muted)]">
          Each graph is an isolated notebook: its own journals, pages, and
          links. Share graphs you own with other users by username.
        </p>
        <ul className="space-y-3">
          {graphs.map((g) => (
            <li
              key={g.id}
              className="rounded-md border border-[var(--nodra-border)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
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
              </div>
              <GraphSharePanel
                graphId={g.id}
                isOwner={ownerById.get(g.id) ?? false}
                initialShares={sharesByGraph.get(g.id) ?? []}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }
}
