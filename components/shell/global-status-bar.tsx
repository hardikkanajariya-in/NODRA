"use client";

import { format } from "date-fns";
import { useAppActivity } from "./app-activity-context";

export function GlobalStatusBar() {
  const {
    saveStatus,
    lastSaved,
    uploadActive,
    uploadCount,
    uploadProgress,
    routeLoading,
  } = useAppActivity();

  let message = "";
  if (routeLoading) message = "Loading…";
  else if (uploadActive) {
    const pct = uploadProgress ?? 0;
    if (uploadCount > 1) {
      message = `Uploading ${uploadCount} files · ${pct}%`;
    } else {
      message = pct >= 96 && pct < 100 ? "Processing upload…" : `Uploading · ${pct}%`;
    }
  } else if (saveStatus === "saving") message = "Saving…";
  else if (saveStatus === "error") message = "Save failed";
  else if (saveStatus === "saved" && lastSaved) {
    message = `Saved ${format(lastSaved, "h:mm a")}`;
  }

  if (!message) return null;

  const pct = uploadActive ? Math.max(0, Math.min(100, uploadProgress ?? 0)) : 0;

  return (
    <div className="nodra-global-status flex items-center gap-2 text-xs text-[var(--nodra-muted)]">
      {uploadActive && (
        <span
          className="nodra-upload-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="File upload progress"
        >
          <span
            className="nodra-upload-fill"
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
      {(routeLoading || saveStatus === "saving") && !uploadActive && (
        <span className="nodra-status-dot animate-pulse" aria-hidden />
      )}
      <span>{message}</span>
    </div>
  );
}
