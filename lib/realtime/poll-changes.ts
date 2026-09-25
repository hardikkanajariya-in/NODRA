import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents, pages } from "@/lib/db/schema";
import { getGraphCatalogRevision } from "./catalog";
import type { RealtimeEvent } from "./types";

export async function pollGraphChanges(
  graphId: string,
  since: Date,
  lastCatalogRevision: string | null,
): Promise<{
  events: RealtimeEvent[];
  catalogRevision: string;
  nextSince: Date;
}> {
  const events: RealtimeEvent[] = [];
  let nextSince = since;

  const catalogRevision = await getGraphCatalogRevision(graphId);
  if (lastCatalogRevision !== null && catalogRevision !== lastCatalogRevision) {
    events.push({ type: "pages-changed", catalogRevision });
  }

  const docRows = await db
    .select({
      pageId: documents.pageId,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .innerJoin(pages, eq(pages.id, documents.pageId))
    .where(
      and(eq(pages.graphId, graphId), gt(documents.updatedAt, since)),
    );

  for (const row of docRows) {
    events.push({
      type: "document-updated",
      pageId: row.pageId,
      updatedAt: row.updatedAt.toISOString(),
    });
    if (row.updatedAt > nextSince) {
      nextSince = row.updatedAt;
    }
  }

  const pageRows = await db
    .select({
      id: pages.id,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(and(eq(pages.graphId, graphId), gt(pages.updatedAt, since)));

  for (const row of pageRows) {
    if (row.updatedAt > nextSince) {
      nextSince = row.updatedAt;
    }
  }

  if (nextSince === since) {
    nextSince = new Date();
  }

  return { events, catalogRevision, nextSince };
}
