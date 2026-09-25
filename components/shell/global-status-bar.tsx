"use client";

import { format } from "date-fns";
import { useAppActivity } from "./app-activity-context";

export function GlobalStatusBar() {
  const { saveStatus, lastSaved, uploadActive, uploadProgress, routeLoading } =
    useAppActivity();

  let message = "";
  if (routeLoading) message = "Loading…";
  else if (uploadActive) {
    message = `Uploading image ${uploadProgress ?? 0}%`;
  }
  else if (saveStatus === "saving") message = "Saving…";
  else if (saveStatus === "error") message = "Save failed";
  else if (saveStatus === "saved" && lastSaved) {
    message = `Saved ${format(lastSaved, "h:mm a")}`;
  }

  if (!message) return null;

  return (
    <div className="nodra-global-status flex items-center gap-2 text-xs text-[var(--nodra-muted)]">
      {uploadActive && (
        <span
          className="nodra-upload-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress ?? 0}
          aria-label="Image upload"
        >
          <span
            className="nodra-upload-fill"
            style={{ width: `${uploadProgress ?? 0}%` }}
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
