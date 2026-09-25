import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { saveDocument } from "@/lib/pages/service";

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { pageId } = await params;
  const doc = await db.query.documents.findFirst({
    where: eq(documents.pageId, pageId),
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
}

const putSchema = z.object({
  contentJson: z.record(z.string(), z.unknown()),
});

export async function PUT(request: Request, { params }: Params) {
  const { pageId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid document" }, { status: 400 });
  }

  const result = await saveDocument(pageId, parsed.data.contentJson);
  return NextResponse.json({
    ok: true,
    plainText: result.plainText,
    updatedAt: result.updatedAt.toISOString(),
  });
}
