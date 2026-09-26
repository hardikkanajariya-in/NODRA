"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  existingDates: Set<string>;
  onClose: () => void;
  onCreate: (dates: string[]) => Promise<void>;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function JournalPickerDialog({
  open,
  existingDates,
  onClose,
  onCreate,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, "yyyy-MM-dd");
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const monthLabel = format(viewMonth, "MMMM yyyy");

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setError("");
      setBusy(false);
      setViewMonth(startOfMonth(today));
    }
  }, [open, today]);

  if (!open) return null;

  function toggleDate(day: Date) {
    if (isAfter(day, today)) return;
    const key = format(day, "yyyy-MM-dd");
    if (existingDates.has(key)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllSkippedInView() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const day of calendarDays) {
        if (!isSameMonth(day, viewMonth)) continue;
        if (isAfter(day, today)) continue;
        const key = format(day, "yyyy-MM-dd");
        if (!existingDates.has(key)) next.add(key);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function submit() {
    if (!selected.size) {
      setError("Select at least one date without a journal.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const sorted = [...selected].sort();
      await onCreate(sorted);
      setSelected(new Set());
      onClose();
    } catch {
      setError("Could not create one or more journals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="nodra-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-picker-title"
      onClick={onClose}
    >
      <div
        className="nodra-dialog nodra-journal-picker"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="journal-picker-title" className="text-base font-semibold">
          New journals
        </h2>
        <p className="mt-1 text-sm text-[var(--nodra-muted)]">
          Choose dates that do not have a journal yet. Skipped days are
          highlighted; you can select several at once.
        </p>

        <div className="nodra-journal-picker-nav">
          <button
            type="button"
            className="nodra-icon-btn"
            aria-label="Previous month"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="nodra-journal-picker-month">{monthLabel}</span>
          <button
            type="button"
            className="nodra-icon-btn"
            aria-label="Next month"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            disabled={isSameMonth(viewMonth, today)}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="nodra-journal-picker-weekdays">
          {weekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="nodra-journal-picker-grid">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, viewMonth);
            const isFuture = isAfter(day, today);
            const hasJournal = existingDates.has(key);
            const isSkipped = inMonth && !isFuture && !hasJournal;
            const isSelected = selected.has(key);
            const isToday = key === todayStr;

            return (
              <button
                key={key}
                type="button"
                disabled={!inMonth || isFuture || hasJournal}
                className={[
                  "nodra-journal-picker-day",
                  !inMonth && "nodra-journal-picker-day--outside",
                  hasJournal && "nodra-journal-picker-day--has-journal",
                  isSkipped && "nodra-journal-picker-day--skipped",
                  isSelected && "nodra-journal-picker-day--selected",
                  isToday && "nodra-journal-picker-day--today",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => toggleDate(day)}
                title={
                  hasJournal
                    ? `${format(day, "MMM d, yyyy")} — journal exists`
                    : isFuture
                      ? "Future dates are not available"
                      : format(day, "MMM d, yyyy")
                }
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        <div className="nodra-journal-picker-legend">
          <span>
            <i className="nodra-journal-picker-swatch nodra-journal-picker-swatch--skipped" />
            No journal
          </span>
          <span>
            <i className="nodra-journal-picker-swatch nodra-journal-picker-swatch--has" />
            Has journal
          </span>
          <span>
            <i className="nodra-journal-picker-swatch nodra-journal-picker-swatch--selected" />
            Selected
          </span>
        </div>

        <div className="nodra-journal-picker-actions-row">
          <button
            type="button"
            className="nodra-journal-picker-link-btn"
            onClick={selectAllSkippedInView}
          >
            Select all skipped this month
          </button>
          <button
            type="button"
            className="nodra-journal-picker-link-btn"
            onClick={clearSelection}
            disabled={!selected.size}
          >
            Clear
          </button>
        </div>

        {error ? (
          <p className="mt-2 text-xs text-[var(--nodra-danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="nodra-dialog-actions">
          <button
            type="button"
            className="nodra-dialog-btn nodra-dialog-btn--ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="nodra-dialog-btn nodra-dialog-btn--primary"
            onClick={() => void submit()}
            disabled={busy || !selected.size}
          >
            {busy
              ? "Creating…"
              : selected.size === 1
                ? "Create journal"
                : `Create ${selected.size} journals`}
          </button>
        </div>
      </div>
    </div>
  );
}

export type JournalListItem = {
  id: string;
  name: string;
  slug: string;
  journalDate: string | null;
};

export function journalDatesFromList(items: JournalListItem[]): Set<string> {
  const set = new Set<string>();
  for (const item of items) {
    if (item.journalDate) set.add(String(item.journalDate));
    else if (/^\d{4}-\d{2}-\d{2}$/.test(item.slug)) set.add(item.slug);
  }
  return set;
}

export async function createJournalsForDates(dates: string[]): Promise<void> {
  for (const date of dates) {
    const res = await fetch(`/api/journals/${date}`);
    if (!res.ok) {
      throw new Error(`Failed for ${date}`);
    }
  }
}

export function journalDayLabel(dateStr: string): string {
  try {
    return format(parseISO(`${dateStr}T12:00:00`), "MMM do");
  } catch {
    return dateStr;
  }
}
