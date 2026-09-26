import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { graphs, pages } from "@/lib/db/schema";
import { pageSlugFromName } from "@/lib/utils/slug";
import { canAccessGraph, isGraphOwner } from "@/lib/graphs/access";
import { deleteAllPageAssets } from "@/lib/assets/service";

export async function updateGraphName(
  graphId: string,
  ownerUserId: string,
  name: string,
): Promise<
  | { ok: true; graph: typeof graphs.$inferSelect }
  | { ok: false; error: string }
> {
  const owner = await isGraphOwner(ownerUserId, graphId);
  if (!owner) {
    return { ok: false, error: "Only the graph owner can rename it" };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name is required" };
  }

  const baseSlug = pageSlugFromName(trimmed);
  let slug = baseSlug;
  for (let i = 0; i < 50; i++) {
    const existing = await db.query.graphs.findFirst({
      where: eq(graphs.slug, slug),
    });
    if (!existing || existing.id === graphId) break;
    slug = i === 0 ? `${baseSlug}-2` : `${baseSlug}-${i + 2}`;
  }

  const [graph] = await db
    .update(graphs)
    .set({ name: trimmed, slug, updatedAt: new Date() })
    .where(eq(graphs.id, graphId))
    .returning();

  if (!graph) {
    return { ok: false, error: "Graph not found" };
  }

  return { ok: true, graph };
}

export async function deleteGraphHard(
  graphId: string,
  ownerUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await isGraphOwner(ownerUserId, graphId);
  if (!owner) {
    return { ok: false, error: "Only the graph owner can delete it" };
  }

  const graphPages = await db.query.pages.findMany({
    where: eq(pages.graphId, graphId),
    columns: { id: true },
  });

  for (const page of graphPages) {
    await deleteAllPageAssets(page.id);
  }

  await db.delete(graphs).where(eq(graphs.id, graphId));

  return { ok: true };
}

export async function assertGraphOwnerOrError(
  userId: string,
  graphId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await canAccessGraph(userId, graphId))) {
    return { ok: false, error: "Forbidden" };
  }
  if (!(await isGraphOwner(userId, graphId))) {
    return { ok: false, error: "Only the graph owner can do this" };
  }
  return { ok: true };
}
