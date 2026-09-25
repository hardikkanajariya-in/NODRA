"use client";

import { useState } from "react";
import { LogseqHeader } from "./logseq-header";
import {
  LogseqSidebar,
  type SidebarPage,
} from "./logseq-sidebar";
import type { GraphSummary } from "./graph-switcher";
import { SaveStatusProvider } from "./save-status-context";
import { ThemeProvider } from "./theme-provider";

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
      <SaveStatusProvider>
        <div className="nodra-app flex h-screen">
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
          <div className="flex min-w-0 flex-1 flex-col">
            <LogseqHeader />
            <main className="nodra-main min-h-0 flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </SaveStatusProvider>
    </ThemeProvider>
  );
}
