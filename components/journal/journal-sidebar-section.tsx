"use client";

import { format, parseISO } from "date-fns";
import { CalendarPlus, ChevronRight, Loader2 } from "lucide-react";
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

type MonthGroup = {
  key: string;
  label: string;
  items: { id: string; dateStr: string; href: string; name: string }[];
};

function journalDateStr(j: JournalListItem): string | null {
  if (j.journalDate) return String(j.journalDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(j.slug)) return j.slug;
  return null;
}

function groupJournalsByMonth(
  journals: JournalListItem[],
  excludeDate: string,
): MonthGroup[] {
  const byMonth = new Map<string, MonthGroup>();

  const sorted = [...journals]
    .map((j) => ({ j, dateStr: journalDateStr(j) }))
    .filter((x): x is { j: JournalListItem; dateStr: string } => Boolean(x.dateStr))
    .filter(({ dateStr }) => dateStr !== excludeDate)
    .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

  for (const { j, dateStr } of sorted) {
    const key = dateStr.slice(0, 7);
    let group = byMonth.get(key);
    if (!group) {
      group = {
        key,
        label: format(parseISO(`${key}-01T12:00:00`), "MMMM yyyy"),
        items: [],
      };
      byMonth.set(key, group);
    }
    group.items.push({
      id: j.id,
      dateStr,
      href: `/journal/${dateStr}`,
      name: j.name,
    });
  }

  return [...byMonth.values()].sort((a, b) => b.key.localeCompare(a.key));
}

function monthKeyFromPathname(pathname: string): string | null {
  const match = pathname.match(/\/journal\/(\d{4}-\d{2})-\d{2}/);
  return match?.[1] ?? null;
}

export function JournalSidebarSection({ onClose, navClass }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayMonth = today.slice(0, 7);
  const [journals, setJournals] = useState<JournalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedPinnedMonths, setCollapsedPinnedMonths] = useState<
    Set<string>
  >(() => new Set());

  const activeMonth = monthKeyFromPathname(pathname);

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

  const monthGroups = useMemo(
    () => groupJournalsByMonth(journals, today),
    [journals, today],
  );

  function isMonthOpen(key: string) {
    const pinned = key === todayMonth || key === activeMonth;
    if (pinned) return !collapsedPinnedMonths.has(key);
    return expandedMonths.has(key);
  }

  function toggleMonth(key: string) {
    const pinned = key === todayMonth || key === activeMonth;
    if (pinned) {
      setCollapsedPinnedMonths((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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
          <p className="nodra-nav-item flex items-center gap-2 px-2.5 py-2 text-xs text-[var(--nodra-muted)] nodra-nav-nested">
            <Loader2 size={14} className="animate-spin" aria-hidden />
            Loading…
          </p>
        ) : monthGroups.length === 0 ? (
          <p className="px-2.5 py-1.5 text-xs text-[var(--nodra-muted)] nodra-nav-nested">
            No other journals yet
          </p>
        ) : (
          <div className="nodra-journal-sidebar-list nodra-nav-nested">
            {monthGroups.map((group) => {
              const open = isMonthOpen(group.key);
              return (
                <div key={group.key} className="nodra-journal-month-group">
                  <button
                    type="button"
                    className="nodra-journal-month-toggle"
                    aria-expanded={open}
                    onClick={() => toggleMonth(group.key)}
                  >
                    <ChevronRight
                      size={14}
                      className={`nodra-journal-month-chevron shrink-0 ${open ? "nodra-journal-month-chevron--open" : ""}`}
                      aria-hidden
                    />
                    <span className="truncate">{group.label}</span>
                    <span className="nodra-journal-month-count">
                      {group.items.length}
                    </span>
                  </button>
                  {open && (
                    <div className="nodra-journal-month-days">
                      {group.items.map((item) => (
                        <ClientNavLink
                          key={item.id}
                          href={item.href}
                          className={`${navClass(pathname === item.href)} nodra-journal-day-link`}
                          onClick={onClose}
                          title={item.name}
                        >
                          <span className="truncate">
                            {journalDayLabel(item.dateStr)}
                          </span>
                        </ClientNavLink>
                      ))}
                    </div>
                  )}
                </div>
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
