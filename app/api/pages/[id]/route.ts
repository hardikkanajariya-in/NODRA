import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { canAccessGraph } from "@/lib/graphs/access";
import {
  deletePage,
  getPageById,
  updateJournalTitle,
  updatePageName,
} from "@/lib/pages/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(page);
}

const patchSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const page = await getPageById(id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canAccessGraph(session.userId, page.graphId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const updated =
    page.type === "journal"
      ? await updateJournalTitle(id, parsed.data.name.trim())
      : await updatePageName(id, parsed.data.name.trim());

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const page = await getPageById(id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canAccessGraph(session.userId, page.graphId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deletePage(id);
  return NextResponse.json({ ok: true });
}
