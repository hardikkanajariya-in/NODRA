import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  createGraph,
  getActiveGraph,
  listGraphs,
} from "@/lib/graphs/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const graphs = await listGraphs(session.userId);
  const active = await getActiveGraph(session.userId);
  return NextResponse.json({ graphs, activeId: active.id });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const graph = await createGraph(parsed.data.name.trim(), session.userId);
  return NextResponse.json(graph);
}
