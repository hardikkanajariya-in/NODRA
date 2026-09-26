import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { extractAssetIdsFromTiptap } from "@/lib/assets/extract-from-doc";
import { deleteFromR2, isR2Configured } from "@/lib/assets/r2";

type AssetRow = typeof assets.$inferSelect;

export async function deleteAssetRecord(row: AssetRow): Promise<void> {
  if (isR2Configured()) {
    try {
      await deleteFromR2(row.storageKey);
    } catch {
      // Still remove DB row so UI does not reference a ghost asset
    }
  }
  await db.delete(assets).where(eq(assets.id, row.id));
}

/** Remove DB + R2 rows for this page that are no longer referenced in contentJson. */
export async function syncPageAssetsFromDocument(
  pageId: string,
  contentJson: Record<string, unknown>,
): Promise<void> {
  const referenced = extractAssetIdsFromTiptap(contentJson);
  const rows = await db.query.assets.findMany({
    where: eq(assets.pageId, pageId),
  });

  for (const row of rows) {
    if (!referenced.has(row.id)) {
      await deleteAssetRecord(row);
    }
  }
}

/** Delete all assets for a page from R2 and DB (call before deleting the page). */
export async function deleteAllPageAssets(pageId: string): Promise<void> {
  const rows = await db.query.assets.findMany({
    where: eq(assets.pageId, pageId),
  });
  for (const row of rows) {
    await deleteAssetRecord(row);
  }
}
