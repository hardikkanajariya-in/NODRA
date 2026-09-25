"use client";

import { Moon, Sun } from "lucide-react";
import { format } from "date-fns";
import { useSaveStatus } from "./save-status-context";
import { useTheme } from "./theme-provider";

export function LogseqHeader() {
  const { status, lastSaved } = useSaveStatus();
  const { theme, toggle } = useTheme();

  let saveLabel = "";
  if (status === "saving") saveLabel = "Saving…";
  else if (status === "error") saveLabel = "Save failed";
  else if (status === "saved" && lastSaved) {
    saveLabel = `Saved ${format(lastSaved, "h:mm a")}`;
  }

  return (
    <div className="nodra-main-toolbar flex h-10 shrink-0 items-center justify-end gap-3 border-b border-[var(--nodra-border)] px-4">
      {saveLabel && (
        <span className="text-xs text-[var(--nodra-muted)]">{saveLabel}</span>
      )}
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
