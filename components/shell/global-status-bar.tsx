"use client";

import { format } from "date-fns";
import { useAppActivity } from "./app-activity-context";

export function GlobalStatusBar() {
  const { saveStatus, lastSaved, uploadActive, routeLoading } =
    useAppActivity();

  let message = "";
  if (routeLoading) message = "Loading…";
  else if (uploadActive) message = "Uploading…";
  else if (saveStatus === "saving") message = "Saving…";
  else if (saveStatus === "error") message = "Save failed";
  else if (saveStatus === "saved" && lastSaved) {
    message = `Saved ${format(lastSaved, "h:mm a")}`;
  }

  if (!message) return null;

  return (
    <div className="nodra-global-status flex items-center gap-2 text-xs text-[var(--nodra-muted)]">
      {(routeLoading || uploadActive || saveStatus === "saving") && (
        <span className="nodra-status-dot animate-pulse" aria-hidden />
      )}
      <span>{message}</span>
    </div>
  );
}
