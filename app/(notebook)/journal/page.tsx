import { getJournalFeed } from "@/lib/pages/service";
import { getErrorMessage } from "@/lib/pages/document";
import { getSessionUserActiveGraphId } from "@/lib/graphs/session-graph";
import { ConnectionError } from "@/components/errors/connection-error";
import { JournalFeedView } from "@/components/journal/journal-feed-view";

export const dynamic = "force-dynamic";

export default async function JournalFeedPage() {
  try {
    const graphId = await getSessionUserActiveGraphId();
    const entries = await getJournalFeed(graphId);

    return (
      <JournalFeedView
        entries={entries.map((e) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          contentJson: e.document!.contentJson as Record<string, unknown>,
        }))}
      />
    );
  } catch (error) {
    return <ConnectionError message={getErrorMessage(error)} />;
  }
}
