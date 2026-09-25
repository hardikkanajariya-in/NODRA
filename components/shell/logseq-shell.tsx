"use client";

import { useState } from "react";
import { LogseqHeader } from "./logseq-header";
import { LogseqSidebar, type SidebarPage } from "./logseq-sidebar";
import { SaveStatusProvider } from "./save-status-context";
import { ThemeProvider } from "./theme-provider";

type Props = {
  pages: SidebarPage[];
  children: React.ReactNode;
};

export function LogseqShell({ pages, children }: Props) {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <SaveStatusProvider>
        <div className="nodra-app flex h-screen">
          <LogseqSidebar
            pages={pages}
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
