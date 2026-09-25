"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { GitBranch, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export type SidebarPage = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  pages: SidebarPage[];
  search: string;
  open: boolean;
  onClose: () => void;
};

export function LogseqSidebar({ pages, search, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.name.toLowerCase().includes(q));
  }, [pages, search]);

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
        router.push(`/page/${page.slug}`);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  const navClass = (active: boolean) =>
    `nodra-nav-item block rounded px-2 py-1 text-sm ${active ? "active" : ""}`;

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
        className={`nodra-sidebar flex w-[260px] shrink-0 flex-col border-r p-3 ${open ? "open" : ""}`}
      >
        <div className="mb-4">
          <p className="nodra-sidebar-label mb-1">Journals</p>
          <Link
            href={`/journal/${today}`}
            className={navClass(pathname === `/journal/${today}`)}
            onClick={onClose}
          >
            Today
          </Link>
          <Link
            href={`/journal/${yesterday}`}
            className={navClass(pathname === `/journal/${yesterday}`)}
            onClick={onClose}
          >
            Yesterday
          </Link>
          <Link
            href="/journal"
            className={navClass(pathname === "/journal")}
            onClick={onClose}
          >
            All journals
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="nodra-sidebar-label mb-1">Pages</p>
          <div className="space-y-0.5">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/page/${p.slug}`}
                className={navClass(pathname === `/page/${p.slug}`)}
                onClick={onClose}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-1 border-t border-[var(--nodra-border)] pt-3">
          <Link
            href="/graph"
            className={`${navClass(pathname === "/graph")} flex items-center gap-2`}
            onClick={onClose}
          >
            <GitBranch size={14} />
            Graph
          </Link>
          <button
            type="button"
            className="nodra-nav-item flex w-full items-center gap-2 rounded px-2 py-1 text-sm"
            onClick={createPage}
            disabled={creating}
          >
            <Plus size={14} />
            New page
          </button>
        </div>
      </aside>
    </>
  );
}
