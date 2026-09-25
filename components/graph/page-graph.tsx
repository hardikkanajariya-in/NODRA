"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouteLoadingStart } from "@/components/shell/route-loading-bar";

type GraphResponse = {
  nodes: {
    id: string;
    label: string;
    slug: string;
    type: string;
    journalDate: string | null;
  }[];
  edges: { id: string; source: string; target: string }[];
};

export function PageGraph() {
  const router = useRouter();
  const startRouteLoading = useRouteLoadingStart();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch("/api/graph")
      .then((r) => {
        if (!r.ok) throw new Error("Could not load graph");
        return r.json();
      })
      .then((data: GraphResponse) => {
        if (cancelled) return;
        const q = filter.trim().toLowerCase();
        const visible = data.nodes.filter(
          (n) => !q || n.label.toLowerCase().includes(q),
        );
        const ids = new Set(visible.map((n) => n.id));

        const laid: Node[] = visible.map((n, i) => ({
          id: n.id,
          position: {
            x: (i % 8) * 160,
            y: Math.floor(i / 8) * 80,
          },
          data: { label: n.label, slug: n.slug, type: n.type },
          className: n.type === "journal" ? "nodra-graph-journal" : "",
        }));

        const eds: Edge[] = data.edges
          .filter((e) => ids.has(e.source) && ids.has(e.target))
          .map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: false,
          }));

        setNodes(laid);
        setEdges(eds);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load graph");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const d = node.data as { slug: string; type: string };
      startRouteLoading();
      if (d.type === "journal") {
        router.push(`/journal/${d.slug}`);
      } else {
        router.push(`/pages/${d.slug}`);
      }
    },
    [router, startRouteLoading],
  );

  return (
    <div className="nodra-graph flex h-full flex-col">
      <div className="border-b border-[var(--nodra-border)] p-4">
        <h1 className="text-lg font-medium">Graph view</h1>
        <input
          className="nodra-search mt-2 max-w-sm"
          placeholder="Filter nodes…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="nodra-graph-canvas relative min-h-0 flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--nodra-main)]/80">
            <LoadingSpinner label="Loading graph…" size="sm" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-sm text-[var(--nodra-danger)]">
            {error}
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
