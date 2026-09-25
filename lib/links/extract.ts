const PAGE_REF = /\[\[([^\]]+)\]\]/g;
const TAG_REF = /#(?:\[\[([^\]]+)\]\]|([^\s#\[.,;:!?]+))/g;

export function extractPageNamesFromText(text: string): string[] {
  const names = new Set<string>();

  for (const match of text.matchAll(PAGE_REF)) {
    const name = match[1]?.trim();
    if (name) names.add(name);
  }

  for (const match of text.matchAll(TAG_REF)) {
    const name = (match[1] ?? match[2])?.trim();
    if (name) names.add(name);
  }

  return [...names];
}

export function extractPlainTextFromTiptap(
  doc: Record<string, unknown>,
): string {
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "text" && typeof n.text === "string") {
      parts.push(n.text);
    }
    if (n.type === "pageReference" && typeof n.attrs === "object") {
      const attrs = n.attrs as { label?: string };
      if (attrs.label) parts.push(`[[${attrs.label}]]`);
    }
    if (n.type === "tag" && typeof n.attrs === "object") {
      const attrs = n.attrs as { label?: string; bracketed?: boolean };
      if (attrs.label) {
        parts.push(
          attrs.bracketed ? `#[[${attrs.label}]]` : `#${attrs.label}`,
        );
      }
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child);
      parts.push("\n");
    }
  }

  walk(doc);
  return parts.join("").trim();
}
