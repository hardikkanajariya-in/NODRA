import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { graphs } from "@/lib/db/schema";
import { pageSlugFromName } from "@/lib/utils/slug";
import {
  assertGraphAccess,
  canAccessGraph,
  listAccessibleGraphs,
} from "@/lib/graphs/access";

export const GRAPH_COOKIE = "nodra_graph";

export class NoAccessibleGraphError extends Error {
  constructor() {
    super("No accessible graph");
    this.name = "NoAccessibleGraphError";
  }
}

export async function listGraphs(userId: string) {
  return listAccessibleGraphs(userId);
}

export async function getGraphById(id: string) {
  return db.query.graphs.findFirst({
    where: eq(graphs.id, id),
  });
}

export async function createGraph(name: string, ownerUserId: string) {
  const baseSlug = pageSlugFromName(name);
  let slug = baseSlug;
  for (let i = 0; i < 50; i++) {
    const existing = await db.query.graphs.findFirst({
      where: eq(graphs.slug, slug),
    });
    if (!existing) break;
    if (await canAccessGraph(ownerUserId, existing.id)) {
      return existing;
    }
    slug = i === 0 ? `${baseSlug}-2` : `${baseSlug}-${i + 2}`;
  }

  const [graph] = await db
    .insert(graphs)
    .values({
      name: name.trim(),
      slug,
      ownerUserId,
    })
    .returning();

  return graph;
}

export async function ensureDefaultGraph(userId: string) {
  const all = await listGraphs(userId);
  if (all.length > 0) return all[0];
  return createGraph("Main", userId);
}

export async function getActiveGraphId(userId: string): Promise<string> {
  const all = await listGraphs(userId);
  if (all.length === 0) {
    const created = await ensureDefaultGraph(userId);
    return created!.id;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(GRAPH_COOKIE)?.value;

  if (fromCookie && all.some((g) => g.id === fromCookie)) {
    return fromCookie;
  }

  return all[0]!.id;
}

export async function getActiveGraph(userId: string) {
  const id = await getActiveGraphId(userId);
  const graph = await getGraphById(id);
  if (!graph) {
    return ensureDefaultGraph(userId);
  }
  await assertGraphAccess(userId, graph.id);
  return graph;
}

export function graphCookieOptions(graphId: string) {
  return {
    name: GRAPH_COOKIE,
    value: graphId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
