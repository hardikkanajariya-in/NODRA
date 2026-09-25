"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Database, LayoutGrid, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type GraphSummary = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  graphs: GraphSummary[];
  activeGraph: GraphSummary;
};

export function GraphSwitcher({ graphs, activeGraph }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function switchTo(graphId: string) {
    setOpen(false);
    await fetch("/api/graphs/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graphId }),
    });
    router.push("/journal");
    router.refresh();
  }

  async function createGraph() {
    const name = window.prompt("Graph name");
    if (!name?.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/graphs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const graph = (await res.json()) as GraphSummary;
        await switchTo(graph.id);
      }
    } finally {
      setCreating(false);
    }
  }

  const others = graphs.filter((g) => g.id !== activeGraph.id);

  return (
    <div className="relative border-b border-[var(--nodra-border)] px-3 py-2" ref={ref}>
      <button
        type="button"
        className="nodra-graph-trigger flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate font-semibold text-sm">{activeGraph.name}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--nodra-muted)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="nodra-graph-menu absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border py-1 shadow-lg">
          {others.length > 0 && (
            <>
              <p className="px-3 py-1.5 text-xs font-medium text-[var(--nodra-muted)]">
                Switch to:
              </p>
              {others.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="nodra-graph-menu-item block w-full px-3 py-1.5 text-left text-sm"
                  onClick={() => switchTo(g.id)}
                >
                  {g.name}
                </button>
              ))}
            </>
          )}
          <button
            type="button"
            className="nodra-graph-menu-item flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
            onClick={createGraph}
            disabled={creating}
          >
            <Plus size={14} />
            Create graph
          </button>
          <Link
            href="/graphs"
            className="nodra-graph-menu-item flex items-center gap-2 px-3 py-1.5 text-sm"
            onClick={() => setOpen(false)}
          >
            <LayoutGrid size={14} />
            All graphs
          </Link>
          <span className="nodra-graph-menu-item flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--nodra-muted)]">
            <Database size={14} />
            Import (coming soon)
          </span>
        </div>
      )}
    </div>
  );
}
