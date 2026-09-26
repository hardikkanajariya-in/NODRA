import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { graphShares, users } from "@/lib/db/schema";
import { findUserByUsernameKey } from "@/lib/auth/users";
import { normalizeUsernameKey } from "@/lib/auth/password";
import { isGraphOwner } from "@/lib/graphs/access";

export async function listGraphShares(graphId: string, ownerUserId: string) {
  const owner = await isGraphOwner(ownerUserId, graphId);
  if (!owner) return null;

  return db
    .select({
      id: graphShares.id,
      userId: graphShares.userId,
      username: users.username,
      createdAt: graphShares.createdAt,
    })
    .from(graphShares)
    .innerJoin(users, eq(graphShares.userId, users.id))
    .where(eq(graphShares.graphId, graphId));
}

export async function addGraphShare(
  graphId: string,
  ownerUserId: string,
  targetUsername: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await isGraphOwner(ownerUserId, graphId);
  if (!owner) {
    return { ok: false, error: "Only the graph owner can share" };
  }

  const target = await findUserByUsernameKey(
    normalizeUsernameKey(targetUsername),
  );
  if (!target) {
    return { ok: false, error: "User not found" };
  }
  if (target.id === ownerUserId) {
    return { ok: false, error: "Cannot share with yourself" };
  }

  const existing = await db.query.graphShares.findFirst({
    where: and(
      eq(graphShares.graphId, graphId),
      eq(graphShares.userId, target.id),
    ),
  });
  if (existing) {
    return { ok: false, error: "Already shared with this user" };
  }

  await db.insert(graphShares).values({
    graphId,
    userId: target.id,
  });

  return { ok: true };
}

export async function removeGraphShare(
  graphId: string,
  ownerUserId: string,
  sharedUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await isGraphOwner(ownerUserId, graphId);
  if (!owner) {
    return { ok: false, error: "Only the graph owner can remove shares" };
  }

  await db
    .delete(graphShares)
    .where(
      and(
        eq(graphShares.graphId, graphId),
        eq(graphShares.userId, sharedUserId),
      ),
    );

  return { ok: true };
}
