"use client";

import { format } from "date-fns";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useRouteLoadingStart } from "@/components/shell/route-loading-bar";

type Props = {
  onGoToToday: () => void;
};

export function JournalFeedToolbar({ onGoToToday }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const router = useRouter();
  const startLoading = useRouteLoadingStart();
  const formId = useId();
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openJournal(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Pick a valid date.");
      return;
    }
    if (date > today) {
      setError("Future dates are not supported.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/journals/${date}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not open journal.");
        return;
      }
      setExpanded(false);
      startLoading();
      router.push(`/journal/${date}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nodra-journal-feed-toolbar">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="nodra-journal-toolbar-btn"
          onClick={onGoToToday}
        >
          Go to today
        </button>
        <button
          type="button"
          className="nodra-journal-toolbar-btn nodra-journal-toolbar-btn--primary"
          aria-expanded={expanded}
          aria-controls={formId}
          onClick={() => {
            setError("");
            setDate(today);
            setExpanded((open) => !open);
          }}
        >
          <CalendarPlus size={15} aria-hidden />
          New journal
        </button>
      </div>

      {expanded && (
        <form
          id={formId}
          className="nodra-journal-create-form"
          onSubmit={(e) => void openJournal(e)}
        >
          <label className="nodra-journal-create-label">
            <span className="sr-only">Journal date</span>
            <input
              type="date"
              className="nodra-journal-date-input"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
              required
            />
          </label>
          <button
            type="submit"
            className="nodra-journal-toolbar-btn nodra-journal-toolbar-btn--submit"
            disabled={busy}
          >
            Open
            <ChevronRight size={14} aria-hidden />
          </button>
          {error ? (
            <p className="nodra-journal-create-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
