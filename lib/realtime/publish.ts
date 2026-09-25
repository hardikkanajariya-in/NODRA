import { getGraphCatalogRevision } from "./catalog";
import { publishGraph } from "./hub";
import type { RealtimeEvent } from "./types";

export async function notifyDocumentUpdated(
  graphId: string,
  pageId: string,
  updatedAt: Date,
): Promise<void> {
  const event: RealtimeEvent = {
    type: "document-updated",
    pageId,
    updatedAt: updatedAt.toISOString(),
  };
  publishGraph(graphId, event);
}

export async function notifyPagesChanged(graphId: string): Promise<void> {
  const catalogRevision = await getGraphCatalogRevision(graphId);
  publishGraph(graphId, { type: "pages-changed", catalogRevision });
}
