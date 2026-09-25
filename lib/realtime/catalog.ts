import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";

export async function getGraphCatalogRevision(
  graphId: string,
): Promise<string> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      maxUpdated: sql<Date | null>`max(${pages.updatedAt})`,
    })
    .from(pages)
    .where(eq(pages.graphId, graphId));

  const count = row?.count ?? 0;
  const max = row?.maxUpdated?.getTime() ?? 0;
  return `${count}:${max}`;
}
