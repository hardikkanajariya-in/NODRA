import Link from "next/link";
import { listJournals } from "@/lib/pages/service";

export default async function JournalListPage() {
  let journals: Awaited<ReturnType<typeof listJournals>> = [];
  try {
    journals = await listJournals(60);
  } catch {
    journals = [];
  }

  return (
    <div className="nodra-content mx-auto max-w-3xl p-6">
      <h1 className="nodra-page-title mb-4">Journals</h1>
      <ul className="space-y-1">
        {journals.map((j) => (
          <li key={j.id}>
            <Link
              href={`/journal/${j.slug}`}
              className="nodra-page-ref text-base"
            >
              {j.name}
            </Link>
          </li>
        ))}
      </ul>
      {journals.length === 0 && (
        <p className="text-sm text-[var(--nodra-muted)]">
          Open Today from the sidebar to start your first journal.
        </p>
      )}
    </div>
  );
}
