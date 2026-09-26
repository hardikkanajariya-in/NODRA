import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { canAccessGraph } from "@/lib/graphs/access";
import { getGraphById, graphCookieOptions } from "@/lib/graphs/service";

const bodySchema = z.object({
  graphId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid graph" }, { status: 400 });
  }

  const graph = await getGraphById(parsed.data.graphId);
  if (!graph) {
    return NextResponse.json({ error: "Graph not found" }, { status: 404 });
  }

  const allowed = await canAccessGraph(session.userId, graph.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, graph });
  response.cookies.set(graphCookieOptions(graph.id));
  return response;
}
