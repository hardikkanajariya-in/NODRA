import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type JsonNode = Record<string, unknown>;

/** Unwrap pasted blocks into list items the current outline can hold. */
export function listItemsFromPaste(content: JsonNode[]): JsonNode[] | null {
  const items: JsonNode[] = [];
  for (const node of content) {
    if (node.type === "bulletList" && Array.isArray(node.content)) {
      items.push(...(node.content as JsonNode[]));
      continue;
    }
    if (node.type === "paragraph" || node.type === "image") {
      const blocks =
        node.type === "image" ? [{ type: "paragraph" }, node] : [node];
      items.push({ type: "listItem", content: blocks });
      continue;
    }
    if (node.type === "propertyBlock") {
      items.push({
        type: "listItem",
        content: [{ type: "paragraph" }, node],
      });
      continue;
    }
    return null;
  }
  return items.length ? items : null;
}

function isEmptyListItem(node: ProseMirrorNode): boolean {
  if (node.childCount !== 1) return false;
  const first = node.firstChild;
  return first?.type.name === "paragraph" && first.content.size === 0;
}

/**
 * Where to drop pasted list items.
 * An empty block is replaced. A block that already has text keeps its text,
 * and the paste is inserted as the next sibling.
 */
export function outlinePasteRange(
  doc: ProseMirrorNode,
  pos: number,
): { from: number; to: number } | null {
  const clamped = Math.max(0, Math.min(pos, doc.content.size));
  const $pos = doc.resolve(clamped);
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name !== "listItem") continue;
    const from = $pos.before(depth);
    const item = $pos.node(depth);
    const to = from + item.nodeSize;
    if (isEmptyListItem(item)) return { from, to };
    return { from: to, to };
  }
  return null;
}
