import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { canAccessGraph } from "@/lib/graphs/access";
import {
  deleteGraphHard,
  updateGraphName,
} from "@/lib/graphs/manage";
import { getGraphById } from "@/lib/graphs/service";

type Params = { params: Promise<{ graphId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { graphId } = await params;
  const allowed = await canAccessGraph(session.userId, graphId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = z.object({ name: z.string().min(1).max(120) }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const result = await updateGraphName(
    graphId,
    session.userId,
    parsed.data.name,
  );
  if (!result.ok) {
    const status = result.error.includes("owner") ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.graph);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { graphId } = await params;
  const graph = await getGraphById(graphId);
  if (!graph) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await deleteGraphHard(graphId, session.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
