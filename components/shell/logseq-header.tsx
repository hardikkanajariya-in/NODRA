"use client";

import { Menu, Moon, Sun, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";
import { GlobalStatusBar } from "./global-status-bar";
import { useAppActivity } from "./app-activity-context";

type Props = {
  onMenuClick?: () => void;
};

function headerTitle(pathname: string): string {
  if (pathname === "/journal") return "Journals";
  if (pathname.startsWith("/journal/")) {
    const slug = pathname.split("/").pop() ?? "";
    return slug;
  }
  if (pathname.startsWith("/pages/")) {
    const slug = decodeURIComponent(pathname.replace(/^\/pages\//, ""));
    return slug.replace(/-/g, " ");
  }
  if (pathname === "/graph") return "Graph";
  if (pathname === "/graphs") return "Graphs";
  if (pathname === "/settings") return "Settings";
  return "NODRA";
}

export function LogseqHeader({ onMenuClick }: Props) {
  const { theme, toggle } = useTheme();
  const { activeUsers } = useAppActivity();
  const pathname = usePathname();
  const title = headerTitle(pathname);

  return (
    <header className="nodra-main-toolbar flex h-11 shrink-0 items-center gap-3 border-b border-[var(--nodra-border)] px-3 md:px-4">
      <button
        type="button"
        className="nodra-icon-btn -ml-1 md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      <div className="nodra-toolbar-title min-w-0 flex-1 truncate text-sm font-medium">
        {title}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {activeUsers > 0 && (
          <span
            className="nodra-active-users flex items-center gap-1 text-xs text-[var(--nodra-muted)]"
            title="Active sessions on this graph"
          >
            <Users size={14} aria-hidden />
            <span>{activeUsers}</span>
          </span>
        )}
        <GlobalStatusBar />
        <button
          type="button"
          className="nodra-icon-btn"
          onClick={toggle}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
