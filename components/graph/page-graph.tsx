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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    void fetch("/api/graph")
      .then((r) => r.json())
      .then((data: GraphResponse) => {
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
      });
  }, [filter, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const d = node.data as { slug: string; type: string };
      if (d.type === "journal") {
        router.push(`/journal/${d.slug}`);
      } else {
        router.push(`/page/${d.slug}`);
      }
    },
    [router],
  );

  return (
    <div className="nodra-graph h-full flex flex-col">
      <div className="border-b border-[var(--nodra-border)] p-4">
        <h1 className="text-lg font-medium">Graph</h1>
        <input
          className="nodra-search mt-2 max-w-sm"
          placeholder="Filter nodes…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
