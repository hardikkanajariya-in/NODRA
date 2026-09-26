import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { graphShares, graphs, users } from "@/lib/db/schema";

export type AdminGraphSummary = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string | null;
  ownerUsername: string | null;
};

export type AdminUserDirectoryEntry = {
  id: string;
  username: string;
  createdAt: string;
  ownedGraphs: AdminGraphSummary[];
  sharedGraphs: AdminGraphSummary[];
};

export async function listAdminUserDirectory(): Promise<AdminUserDirectoryEntry[]> {
  const allUsers = await db.query.users.findMany({
    orderBy: [asc(users.createdAt)],
    columns: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  const allGraphs = await db
    .select({
      id: graphs.id,
      name: graphs.name,
      slug: graphs.slug,
      ownerUserId: graphs.ownerUserId,
      ownerUsername: users.username,
    })
    .from(graphs)
    .leftJoin(users, eq(graphs.ownerUserId, users.id))
    .orderBy(asc(graphs.createdAt));

  const shareRows = await db
    .select({
      graphId: graphShares.graphId,
      userId: graphShares.userId,
      graphName: graphs.name,
      graphSlug: graphs.slug,
      ownerUserId: graphs.ownerUserId,
      ownerUsername: users.username,
    })
    .from(graphShares)
    .innerJoin(graphs, eq(graphShares.graphId, graphs.id))
    .leftJoin(users, eq(graphs.ownerUserId, users.id));

  const ownedByUser = new Map<string, AdminGraphSummary[]>();
  for (const g of allGraphs) {
    if (!g.ownerUserId) continue;
    const list = ownedByUser.get(g.ownerUserId) ?? [];
    list.push({
      id: g.id,
      name: g.name,
      slug: g.slug,
      ownerUserId: g.ownerUserId,
      ownerUsername: g.ownerUsername,
    });
    ownedByUser.set(g.ownerUserId, list);
  }

  const sharedByUser = new Map<string, AdminGraphSummary[]>();
  for (const row of shareRows) {
    const list = sharedByUser.get(row.userId) ?? [];
    list.push({
      id: row.graphId,
      name: row.graphName,
      slug: row.graphSlug,
      ownerUserId: row.ownerUserId,
      ownerUsername: row.ownerUsername,
    });
    sharedByUser.set(row.userId, list);
  }

  return allUsers.map((u) => ({
    id: u.id,
    username: u.username,
    createdAt: u.createdAt.toISOString(),
    ownedGraphs: ownedByUser.get(u.id) ?? [],
    sharedGraphs: sharedByUser.get(u.id) ?? [],
  }));
}

export async function transferGraphOwner(
  graphId: string,
  newOwnerUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const graph = await db.query.graphs.findFirst({
    where: eq(graphs.id, graphId),
    columns: { id: true },
  });
  if (!graph) {
    return { ok: false, error: "Graph not found" };
  }

  const owner = await db.query.users.findFirst({
    where: eq(users.id, newOwnerUserId),
    columns: { id: true },
  });
  if (!owner) {
    return { ok: false, error: "User not found" };
  }

  await db
    .update(graphs)
    .set({ ownerUserId: newOwnerUserId })
    .where(eq(graphs.id, graphId));

  await db
    .delete(graphShares)
    .where(
      and(
        eq(graphShares.graphId, graphId),
        eq(graphShares.userId, newOwnerUserId),
      ),
    );

  return { ok: true };
}

export async function listOrphanGraphs(): Promise<AdminGraphSummary[]> {
  const rows = await db
    .select({
      id: graphs.id,
      name: graphs.name,
      slug: graphs.slug,
      ownerUserId: graphs.ownerUserId,
    })
    .from(graphs)
    .where(isNull(graphs.ownerUserId))
    .orderBy(asc(graphs.createdAt));

  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    ownerUserId: null,
    ownerUsername: null,
  }));
}
