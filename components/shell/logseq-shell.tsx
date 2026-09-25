"use client";

import { useState } from "react";
import { LogseqHeader } from "./logseq-header";
import { LogseqSidebar, type SidebarPage } from "./logseq-sidebar";
import { AppActivityProvider } from "./app-activity-context";
import { RouteLoadingBar } from "./route-loading-bar";
import { ThemeProvider } from "./theme-provider";
import type { GraphSummary } from "./graph-switcher";
import { RealtimeSync } from "./realtime-sync";

type Props = {
  pages: SidebarPage[];
  graphs: GraphSummary[];
  activeGraph: GraphSummary;
  children: React.ReactNode;
};

export function LogseqShell({
  pages,
  graphs,
  activeGraph,
  children,
}: Props) {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <AppActivityProvider>
        <RealtimeSync graphId={activeGraph.id} />
        <div className="nodra-app flex h-screen overflow-hidden">
          <RouteLoadingBar />
          <LogseqSidebar
            pages={pages}
            graphs={graphs}
            activeGraph={activeGraph}
            search={search}
            onSearchChange={setSearch}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onMenuClick={() => setSidebarOpen((v) => !v)}
          />
          <div className="nodra-main-column flex min-h-0 min-w-0 flex-1 flex-col">
            <LogseqHeader
              onMenuClick={() => setSidebarOpen((v) => !v)}
            />
            <main className="nodra-main min-h-0 flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </AppActivityProvider>
    </ThemeProvider>
  );
}
