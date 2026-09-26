"use client";

import { format } from "date-fns";
import { CalendarPlus, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientNavLink } from "@/components/shell/client-nav-link";
import {
  JournalPickerDialog,
  createJournalsForDates,
  journalDatesFromList,
  journalDayLabel,
  type JournalListItem,
} from "@/components/journal/journal-picker-dialog";

type Props = {
  onClose: () => void;
  navClass: (active: boolean) => string;
};

export function JournalSidebarSection({ onClose, navClass }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [journals, setJournals] = useState<JournalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadJournals = useCallback(async () => {
    try {
      const res = await fetch("/api/journals");
      if (!res.ok) return;
      const data = (await res.json()) as JournalListItem[];
      setJournals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/journals");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as JournalListItem[];
        setJournals(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const existingDates = useMemo(
    () => journalDatesFromList(journals),
    [journals],
  );

  const recent = useMemo(() => {
    return [...journals]
      .filter((j) => j.journalDate || /^\d{4}-\d{2}-\d{2}$/.test(j.slug))
      .sort((a, b) => {
        const da = a.journalDate ?? a.slug;
        const db = b.journalDate ?? b.slug;
        return db.localeCompare(da);
      })
      .slice(0, 24);
  }, [journals]);

  async function onCreateDates(dates: string[]) {
    await createJournalsForDates(dates);
    await loadJournals();
    const newest = [...dates].sort().reverse()[0];
    if (newest) {
      router.push(`/journal/${newest}`);
      router.refresh();
    }
  }

  return (
    <>
      <p className="nodra-sidebar-label flex items-center justify-between px-2.5 pb-1">
        <span>Journal</span>
        <button
          type="button"
          className="nodra-sidebar-inline-btn"
          onClick={() => setPickerOpen(true)}
          title="New journal"
        >
          <CalendarPlus size={14} aria-hidden />
          <span className="sr-only">New journal</span>
        </button>
      </p>
      <nav className="mb-1 space-y-0.5">
        <ClientNavLink
          href="/journal"
          className={navClass(pathname === "/journal")}
          onClick={onClose}
        >
          All journals
        </ClientNavLink>
        <ClientNavLink
          href={`/journal/${today}`}
          className={`${navClass(pathname === `/journal/${today}`)} nodra-nav-nested`}
          onClick={onClose}
        >
          Today
        </ClientNavLink>
        {loading ? (
          <p className="nodra-nav-item flex items-center gap-2 px-2.5 py-2 text-xs text-[var(--nodra-muted)]">
            <Loader2 size={14} className="animate-spin" aria-hidden />
            Loading…
          </p>
        ) : recent.length === 0 ? (
          <p className="px-2.5 py-1.5 text-xs text-[var(--nodra-muted)] nodra-nav-nested">
            No journals yet
          </p>
        ) : (
          <div className="nodra-journal-sidebar-list nodra-nav-nested">
            {recent.map((j) => {
              const dateStr = j.journalDate ?? j.slug;
              const href = `/journal/${dateStr}`;
              return (
                <ClientNavLink
                  key={j.id}
                  href={href}
                  className={navClass(pathname === href)}
                  onClick={onClose}
                  title={j.name}
                >
                  <span className="truncate">{journalDayLabel(dateStr)}</span>
                </ClientNavLink>
              );
            })}
          </div>
        )}
      </nav>

      <JournalPickerDialog
        open={pickerOpen}
        existingDates={existingDates}
        onClose={() => setPickerOpen(false)}
        onCreate={onCreateDates}
      />
    </>
  );
}
