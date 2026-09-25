import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createGraph,
  getActiveGraph,
  listGraphs,
} from "@/lib/graphs/service";

export async function GET() {
  const graphs = await listGraphs();
  const active = await getActiveGraph();
  return NextResponse.json({ graphs, activeId: active.id });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const graph = await createGraph(parsed.data.name.trim());
  return NextResponse.json(graph);
}
