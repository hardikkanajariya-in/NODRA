import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  addGraphShare,
  listGraphShares,
  removeGraphShare,
} from "@/lib/graphs/shares";

type Params = { params: Promise<{ graphId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { graphId } = await params;
  const shares = await listGraphShares(graphId, session.userId);
  if (shares === null) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ shares });
}

const postSchema = z.object({
  username: z.string().min(1),
});

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { graphId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const result = await addGraphShare(
    graphId,
    session.userId,
    parsed.data.username,
  );
  if (!result.ok) {
    const status = result.error === "Only the graph owner can share" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { graphId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await removeGraphShare(
    graphId,
    session.userId,
    parsed.data.userId,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
