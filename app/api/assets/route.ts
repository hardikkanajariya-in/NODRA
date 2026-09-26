import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, pages } from "@/lib/db/schema";
import { isR2Configured, uploadToR2 } from "@/lib/assets/r2";
import { buildAssetStorageKey } from "@/lib/assets/storage-key";
import { requireSession } from "@/lib/auth/session";
import { canAccessGraph } from "@/lib/graphs/access";

export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Asset storage is not configured" },
      { status: 503 },
    );
  }

  const session = await requireSession();

  const form = await request.formData();
  const file = form.get("file");
  const pageId = form.get("pageId");

  if (!(file instanceof File) || typeof pageId !== "string") {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const page = await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
    with: { graph: true },
  });
  if (!page?.graph) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (!(await canAccessGraph(session.userId, page.graphId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "bin";
  const id = randomUUID();
  const storageKey = buildAssetStorageKey(
    session.username,
    page,
    `${id}.${ext}`,
  );

  await uploadToR2(storageKey, buffer, file.type || "application/octet-stream");

  const [row] = await db
    .insert(assets)
    .values({
      id,
      pageId,
      storageKey,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
    })
    .returning();

  return NextResponse.json({
    id: row.id,
    url: `/api/assets/${row.id}`,
  });
}
