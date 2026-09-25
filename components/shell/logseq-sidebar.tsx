"use client";

import Link from "next/link";
import { ClientNavLink } from "./client-nav-link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  GitBranch,
  Menu,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
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
  onMenuClick?: () => void;
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

  const today = format(new Date(), "yyyy-MM-dd");
  const onGraph = pathname === "/graph";
  const onSettings = pathname === "/settings";

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
    `nodra-nav-item flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] leading-tight ${
      active ? "active" : ""
    }`;

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
        className={`nodra-sidebar hidden h-full w-[var(--nodra-sidebar-w)] shrink-0 flex-col border-r md:flex ${open ? "open" : ""}`}
      >
        <div className="nodra-sidebar-brand flex h-11 shrink-0 items-center gap-2 border-b border-[var(--nodra-border)] px-3">
          <button
            type="button"
            className="nodra-icon-btn md:hidden"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <Link href="/journal" className="nodra-brand flex min-w-0 items-center gap-2">
            <span className="nodra-brand-mark" aria-hidden />
            <span className="truncate text-sm font-semibold tracking-tight">
              NODRA
            </span>
          </Link>
        </div>

        <GraphSwitcher graphs={graphs} activeGraph={activeGraph} />

        <div className="px-3 py-2.5">
          <div className="nodra-search-wrap flex items-center gap-2 rounded-lg px-2.5 py-2">
            <Search size={15} className="shrink-0 text-[var(--nodra-muted)]" />
            <input
              type="search"
              placeholder="Search pages…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="nodra-search-input w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--nodra-muted)]"
            />
          </div>
        </div>

        <div className="nodra-sidebar-scroll flex-1 overflow-y-auto px-2 pb-2">
          <p className="nodra-sidebar-label px-2.5 pb-1">Journal</p>
          <nav className="mb-1 space-y-0.5">
            <ClientNavLink
              href="/journal"
              className={navClass(pathname === "/journal")}
              onClick={onClose}
            >
              <CalendarDays size={16} className="shrink-0 opacity-80" />
              All journals
            </ClientNavLink>
            <ClientNavLink
              href={`/journal/${today}`}
              className={`${navClass(pathname === `/journal/${today}`)} nodra-nav-nested`}
              onClick={onClose}
            >
              Today
            </ClientNavLink>
          </nav>

          <p className="nodra-sidebar-label mt-3 px-2.5 pb-1">Explore</p>
          <nav className="mb-1 space-y-0.5">
            <ClientNavLink
              href="/graph"
              className={navClass(onGraph)}
              onClick={onClose}
            >
              <GitBranch size={16} className="shrink-0 opacity-80" />
              Graph view
            </ClientNavLink>
            <ClientNavLink
              href="/settings"
              className={navClass(onSettings)}
              onClick={onClose}
            >
              <Settings size={16} className="shrink-0 opacity-80" />
              Settings
            </ClientNavLink>
          </nav>

          <p className="nodra-sidebar-label mt-3 flex items-center justify-between px-2.5 pb-1">
            <span>Pages</span>
            {pages.length > 0 && (
              <span className="normal-case tracking-normal text-[10px] font-medium text-[var(--nodra-muted)]">
                {filtered.length}
              </span>
            )}
          </p>
          <div className="nodra-page-list space-y-0.5">
            {filtered.map((p) => (
              <ClientNavLink
                key={p.id}
                href={`/pages/${p.slug}`}
                className={navClass(pathname === `/pages/${p.slug}`)}
                onClick={onClose}
              >
                <span className="truncate">{p.name}</span>
              </ClientNavLink>
            ))}
            {filtered.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-[var(--nodra-muted)]">
                {search.trim() ? "No matches" : "No pages yet"}
              </p>
            )}
          </div>
        </div>

        <div className="nodra-sidebar-footer shrink-0 border-t border-[var(--nodra-border)] p-2.5">
          <button
            type="button"
            className="nodra-new-page-btn flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium"
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
