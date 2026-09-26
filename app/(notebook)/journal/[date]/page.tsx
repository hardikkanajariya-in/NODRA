import { notFound } from "next/navigation";
import { getOrCreateJournal } from "@/lib/pages/service";
import { getSessionUserActiveGraphId } from "@/lib/graphs/session-graph";
import { getErrorMessage } from "@/lib/pages/document";
import { ConnectionError } from "@/components/errors/connection-error";
import { PageEditor } from "@/components/editor/page-editor";
import { JournalDayNav } from "@/components/journal/journal-day-nav";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ date: string }> };

export default async function JournalDayPage({ params }: Props) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  try {
    const graphId = await getSessionUserActiveGraphId();
    const page = await getOrCreateJournal(graphId, date);

    return (
      <div className="nodra-journal-feed mx-auto max-w-3xl px-6 py-4 md:px-10">
        <JournalDayNav date={date} />
        <section className="nodra-journal-section">
          <h2 className="nodra-journal-date">{page.name}</h2>
          <PageEditor
            pageId={page.id}
            initialContent={
              page.document!.contentJson as Record<string, unknown>
            }
            variant="journal"
          />
        </section>
      </div>
    );
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }
}
