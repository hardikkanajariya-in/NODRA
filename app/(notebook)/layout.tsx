import { listPages } from "@/lib/pages/service";
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

  try {
    const graph = await getActiveGraph();
    activeGraph = { id: graph.id, name: graph.name, slug: graph.slug };
    graphs = await listGraphs();
    pages = await listPages(graph.id);
  } catch {
    pages = [];
    graphs = [];
  }

  return (
    <LogseqShell pages={pages} graphs={graphs} activeGraph={activeGraph}>
      {children}
    </LogseqShell>
  );
}
