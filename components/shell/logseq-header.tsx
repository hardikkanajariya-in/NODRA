"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { GlobalStatusBar } from "./global-status-bar";

type Props = {
  onMenuClick?: () => void;
};

export function LogseqHeader({ onMenuClick }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <div className="nodra-main-toolbar flex h-10 shrink-0 items-center gap-3 border-b border-[var(--nodra-border)] px-4">
      <button
        type="button"
        className="nodra-icon-btn md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <div className="ml-auto flex items-center gap-3">
      <GlobalStatusBar />
      <button
        type="button"
        className="nodra-icon-btn"
        onClick={toggle}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      </div>
    </div>
  );
}
