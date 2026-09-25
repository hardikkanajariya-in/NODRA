import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

import { emptyLogseqDoc } from "@/lib/editor/default-doc";

export const emptyDoc = emptyLogseqDoc;

export async function ensureDocument(pageId: string) {
  const existing = await db.query.documents.findFirst({
    where: eq(documents.pageId, pageId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(documents)
    .values({
      pageId,
      contentJson: emptyDoc,
      plainText: "",
    })
    .returning();

  return created;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown database error";
}
