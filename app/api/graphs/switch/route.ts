import { NextResponse } from "next/server";
import { z } from "zod";
import { getGraphById, graphCookieOptions } from "@/lib/graphs/service";

const bodySchema = z.object({
  graphId: z.string().uuid(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid graph" }, { status: 400 });
  }

  const graph = await getGraphById(parsed.data.graphId);
  if (!graph) {
    return NextResponse.json({ error: "Graph not found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, graph });
  response.cookies.set(graphCookieOptions(graph.id));
  return response;
}
