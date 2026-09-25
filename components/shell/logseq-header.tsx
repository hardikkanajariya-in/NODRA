"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { format } from "date-fns";
import { useSaveStatus } from "./save-status-context";
import { useTheme } from "./theme-provider";

type Props = {
  onMenuClick: () => void;
  search: string;
  onSearchChange: (v: string) => void;
};

export function LogseqHeader({ onMenuClick, search, onSearchChange }: Props) {
  const { status, lastSaved } = useSaveStatus();
  const { theme, toggle } = useTheme();

  let saveLabel = "Ready";
  if (status === "saving") saveLabel = "Saving…";
  else if (status === "error") saveLabel = "Save failed";
  else if (status === "saved" && lastSaved) {
    saveLabel = `Saved ${format(lastSaved, "h:mm a")}`;
  }

  return (
    <header className="nodra-header flex h-11 shrink-0 items-center gap-3 border-b px-3">
      <button
        type="button"
        className="nodra-icon-btn md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <span className="font-semibold tracking-wide text-sm">NODRA</span>
      <input
        type="search"
        placeholder="Search pages…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="nodra-search ml-2 hidden max-w-xs flex-1 sm:block"
      />
      <div className="ml-auto flex items-center gap-2 text-xs text-[var(--nodra-muted)]">
        <span className="hidden sm:inline">{saveLabel}</span>
        <button
          type="button"
          className="nodra-icon-btn"
          onClick={toggle}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
