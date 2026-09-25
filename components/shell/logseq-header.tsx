"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { GlobalStatusBar } from "./global-status-bar";

export function LogseqHeader() {
  const { theme, toggle } = useTheme();

  return (
    <div className="nodra-main-toolbar flex h-10 shrink-0 items-center justify-end gap-3 border-b border-[var(--nodra-border)] px-4">
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
  );
}
