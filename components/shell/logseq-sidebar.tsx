"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  GitBranch,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { GraphSwitcher, type GraphSummary } from "./graph-switcher";

export type SidebarPage = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  pages: SidebarPage[];
  graphs: GraphSummary[];
  activeGraph: GraphSummary;
  search: string;
  onSearchChange: (v: string) => void;
  open: boolean;
  onClose: () => void;
  onMenuClick: () => void;
};

export function LogseqSidebar({
  pages,
  graphs,
  activeGraph,
  search,
  onSearchChange,
  open,
  onClose,
  onMenuClick,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.name.toLowerCase().includes(q));
  }, [pages, search]);

  const recent = filtered.slice(0, 8);

  const onJournal = pathname === "/journal" || pathname.startsWith("/journal/");
  const onPages =
    pathname.startsWith("/page/") || pathname.startsWith("/pages/");
  const onGraph = pathname === "/graph";

  async function createPage() {
    const name = window.prompt("Page name");
    if (!name?.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const page = (await res.json()) as SidebarPage;
        router.push(`/pages/${page.slug}`);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  const navClass = (active: boolean) =>
    `nodra-nav-item flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${active ? "active" : ""}`;

  return (
    <>
      {open && (
        <button
          type="button"
          className="nodra-sidebar-backdrop md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={`nodra-sidebar flex w-[270px] shrink-0 flex-col border-r ${open ? "open" : ""}`}
      >
        <div className="flex items-center gap-1 px-2 pt-2">
          <button
            type="button"
            className="nodra-icon-btn"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>
        </div>
        <GraphSwitcher graphs={graphs} activeGraph={activeGraph} />

        <div className="px-3 py-2">
          <div className="nodra-search-wrap flex items-center gap-2 rounded-md px-2 py-1.5">
            <Search size={15} className="text-[var(--nodra-muted)]" />
            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="nodra-search-input w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <p className="nodra-sidebar-label px-2 pt-1">Navigation</p>
          <nav className="space-y-0.5 px-1">
            <Link
              href="/journal"
              className={navClass(onJournal)}
              onClick={onClose}
            >
              <CalendarDays size={16} />
              Journals
            </Link>
            <Link
              href={recent[0] ? `/pages/${recent[0].slug}` : "/journal"}
              className={navClass(onPages)}
              onClick={onClose}
            >
              <FileText size={16} />
              Pages
            </Link>
            <Link
              href="/graph"
              className={navClass(onGraph)}
              onClick={onClose}
            >
              <GitBranch size={16} />
              Graph view
            </Link>
          </nav>

          <p className="nodra-sidebar-label mt-4 px-2">Recent</p>
          <div className="space-y-0.5 px-1">
            {recent.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.slug}`}
                className={navClass(pathname === `/pages/${p.slug}`)}
                onClick={onClose}
              >
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="px-2 py-1 text-xs text-[var(--nodra-muted)]">
                No pages yet
              </p>
            )}
          </div>

          <p className="nodra-sidebar-label mt-4 px-2">All pages</p>
          <div className="max-h-48 space-y-0.5 overflow-y-auto px-1">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.slug}`}
                className={navClass(pathname === `/pages/${p.slug}`)}
                onClick={onClose}
              >
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--nodra-border)] p-2">
          <button
            type="button"
            className="nodra-nav-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            onClick={createPage}
            disabled={creating}
          >
            <Plus size={16} />
            New page
          </button>
        </div>
      </aside>
    </>
  );
}
