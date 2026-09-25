import { eq, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { graphs } from "@/lib/db/schema";
import { pageSlugFromName } from "@/lib/utils/slug";

export const GRAPH_COOKIE = "nodra_graph";

export async function listGraphs() {
  return db.query.graphs.findMany({
    orderBy: [asc(graphs.createdAt)],
  });
}

export async function getGraphById(id: string) {
  return db.query.graphs.findFirst({
    where: eq(graphs.id, id),
  });
}

export async function createGraph(name: string) {
  const slug = pageSlugFromName(name);
  const existing = await db.query.graphs.findFirst({
    where: eq(graphs.slug, slug),
  });
  if (existing) return existing;

  const [graph] = await db
    .insert(graphs)
    .values({ name: name.trim(), slug })
    .returning();

  return graph;
}

export async function ensureDefaultGraph() {
  const all = await listGraphs();
  if (all.length > 0) return all[0];
  return createGraph("Main");
}

export async function getActiveGraphId(): Promise<string> {
  await ensureDefaultGraph();
  const all = await listGraphs();
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(GRAPH_COOKIE)?.value;

  if (fromCookie && all.some((g) => g.id === fromCookie)) {
    return fromCookie;
  }

  return all[0]!.id;
}

export async function getActiveGraph() {
  const id = await getActiveGraphId();
  const graph = await getGraphById(id);
  if (!graph) {
    const fallback = await ensureDefaultGraph();
    return fallback;
  }
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
