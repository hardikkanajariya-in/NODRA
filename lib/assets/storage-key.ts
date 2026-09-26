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

/** R2 key: `Nodra/{username}/{journal-date|page-slug}/assets/{file}` */
export function buildAssetStorageKey(
  username: string,
  page: PageForStorage,
  fileName: string,
): string {
  const user = sanitizePathSegment(username);
  const scope = sanitizePathSegment(assetScopeSegment(page));
  const name = sanitizePathSegment(fileName);
  return `Nodra/${user}/${scope}/assets/${name}`;
}

function sanitizePathSegment(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return "_";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}
