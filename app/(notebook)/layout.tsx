import { listPages } from "@/lib/pages/service";
import { getSession } from "@/lib/auth/session";
import {
  getActiveGraph,
  listGraphs,
} from "@/lib/graphs/service";
import { LogseqShell } from "@/components/shell/logseq-shell";

export const dynamic = "force-dynamic";

export default async function NotebookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let pages: { id: string; name: string; slug: string }[] = [];
  let graphs: { id: string; name: string; slug: string }[] = [];
  let activeGraph = { id: "", name: "NODRA", slug: "main" };
  let currentUsername = "";

  try {
    const session = await getSession();
    if (!session) {
      throw new Error("Unauthorized");
    }
    currentUsername = session.username;
    const graph = await getActiveGraph(session.userId);
    activeGraph = { id: graph.id, name: graph.name, slug: graph.slug };
    graphs = await listGraphs(session.userId);
    pages = await listPages(graph.id);
  } catch {
    pages = [];
    graphs = [];
  }

  return (
    <LogseqShell
      pages={pages}
      graphs={graphs}
      activeGraph={activeGraph}
      currentUsername={currentUsername}
    >
      {children}
    </LogseqShell>
  );
}
