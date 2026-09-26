import { eq, or, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { graphShares, graphs } from "@/lib/db/schema";

export async function canAccessGraph(
  userId: string,
  graphId: string,
): Promise<boolean> {
  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.id, graphId),
    columns: { id: true, ownerUserId: true },
  });
  if (!graph) return false;
  if (graph.ownerUserId === userId) return true;

  const share = await db.query.graphShares.findFirst({
    where: (t, { and }) => and(eq(t.graphId, graphId), eq(t.userId, userId)),
    columns: { id: true },
  });
  return share !== undefined;
}

export async function isGraphOwner(
  userId: string,
  graphId: string,
): Promise<boolean> {
  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.id, graphId),
    columns: { ownerUserId: true },
  });
  return graph?.ownerUserId === userId;
}

export async function listAccessibleGraphs(userId: string) {
  const sharedRows = await db
    .select({ graphId: graphShares.graphId })
    .from(graphShares)
    .where(eq(graphShares.userId, userId));

  const sharedIds = sharedRows.map((r) => r.graphId);
  const conditions = [eq(graphs.ownerUserId, userId)];
  if (sharedIds.length > 0) {
    conditions.push(inArray(graphs.id, sharedIds));
  }

  return db.query.graphs.findMany({
    where: or(...conditions),
    orderBy: [asc(graphs.createdAt)],
  });
}

export class GraphAccessError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "GraphAccessError";
  }
}

export async function assertGraphAccess(
  userId: string,
  graphId: string,
): Promise<void> {
  const allowed = await canAccessGraph(userId, graphId);
  if (!allowed) {
    throw new GraphAccessError();
  }
}
