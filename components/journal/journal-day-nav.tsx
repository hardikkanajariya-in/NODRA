"use client";

import Link from "next/link";
import { addDays, format, parseISO, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouteLoadingStart } from "@/components/shell/route-loading-bar";

type Props = {
  date: string;
};

export function JournalDayNav({ date }: Props) {
  const startLoading = useRouteLoadingStart();
  const parsed = parseISO(`${date}T12:00:00`);
  const prev = format(subDays(parsed, 1), "yyyy-MM-dd");
  const next = format(addDays(parsed, 1), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const isFuture = date > today;

  return (
    <nav
      className="nodra-journal-nav mb-4 flex items-center justify-between text-sm"
      aria-label="Journal day navigation"
    >
      <Link
        href={`/journal/${prev}`}
        className="nodra-journal-nav-btn flex items-center gap-1"
        onClick={startLoading}
      >
        <ChevronLeft size={16} />
        Previous
      </Link>
      <Link
        href="/journal"
        className="text-[var(--nodra-link)]"
        onClick={startLoading}
      >
        All journals
      </Link>
      {!isFuture ? (
        <Link
          href={`/journal/${next}`}
          className="nodra-journal-nav-btn flex items-center gap-1"
          onClick={startLoading}
        >
          Next
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className="w-16" />
      )}
    </nav>
  );
}
