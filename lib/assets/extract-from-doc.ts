const ASSET_ID_IN_SRC = /\/api\/assets\/([0-9a-f-]{36})/i;

/** Asset IDs referenced by image nodes in a Tiptap/ProseMirror JSON document. */
export function extractAssetIdsFromTiptap(
  doc: Record<string, unknown>,
): Set<string> {
  const ids = new Set<string>();

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;

    if (n.type === "image" && n.attrs && typeof n.attrs === "object") {
      const attrs = n.attrs as { assetId?: string | null; src?: string | null };
      if (typeof attrs.assetId === "string" && attrs.assetId) {
        ids.add(attrs.assetId);
      }
      if (typeof attrs.src === "string") {
        const match = attrs.src.match(ASSET_ID_IN_SRC);
        if (match?.[1]) ids.add(match[1]);
      }
    }

    const content = n.content;
    if (Array.isArray(content)) {
      for (const child of content) walk(child);
    }
  }

  walk(doc);
  return ids;
}
