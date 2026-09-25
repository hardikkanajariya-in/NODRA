import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { getFromR2, isR2Configured } from "@/lib/assets/r2";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Asset storage is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const row = await db.query.assets.findFirst({
    where: eq(assets.id, id),
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { body, mimeType } = await getFromR2(row.storageKey);
  return new NextResponse(body, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
