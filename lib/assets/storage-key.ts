import type { pages } from "@/lib/db/schema";

type PageForStorage = Pick<
  typeof pages.$inferSelect,
  "type" | "journalDate" | "slug"
>;

/** Middle path segment: journal date for daily notes, page slug otherwise. */
export function assetScopeSegment(page: PageForStorage): string {
  if (page.type === "journal" && page.journalDate) {
    return String(page.journalDate);
  }
  return page.slug;
}

export function buildAssetStorageKey(
  graphSlug: string,
  page: PageForStorage,
  fileName: string,
): string {
  const graph = sanitizePathSegment(graphSlug);
  const scope = sanitizePathSegment(assetScopeSegment(page));
  const name = sanitizePathSegment(fileName);
  return `Nodra/${graph}/${scope}/assets/${name}`;
}

function sanitizePathSegment(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return "_";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}
