import { getJournalFeed } from "@/lib/pages/service";
import { getErrorMessage } from "@/lib/pages/document";
import { ConnectionError } from "@/components/errors/connection-error";
import { PageEditor } from "@/components/editor/page-editor";

export const dynamic = "force-dynamic";

export default async function JournalFeedPage() {
  try {
    const entries = await getJournalFeed(14);

    return (
      <div className="nodra-journal-feed mx-auto max-w-3xl px-8 py-6">
        {entries.map((entry, index) => (
          <section
            key={entry.id}
            id={`journal-${entry.slug}`}
            className="nodra-journal-section"
          >
            <h2 className="nodra-journal-date">{entry.name}</h2>
            <PageEditor
              pageId={entry.id}
              initialContent={
                entry.document!.contentJson as Record<string, unknown>
              }
            />
            {index < entries.length - 1 && (
              <hr className="nodra-journal-divider" />
            )}
          </section>
        ))}
      </div>
    );
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }
}
