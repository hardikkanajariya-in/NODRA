import { NextResponse } from "next/server";
import { z } from "zod";
import { deletePage, getPageById, updatePageName } from "@/lib/pages/service";

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
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const updated = await updatePageName(id, parsed.data.name.trim());
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await deletePage(id);
  return NextResponse.json({ ok: true });
}
