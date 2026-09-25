import type { BlockForest, BlockNode, InlineSpan } from "./types";

type PMNode = Record<string, unknown>;

function inlineToPm(spans: InlineSpan[]): PMNode[] {
  const out: PMNode[] = [];
  for (const span of spans) {
    switch (span.type) {
      case "text": {
        if (!span.text) break;
        const node: PMNode = { type: "text", text: span.text };
        if (span.strike) node.marks = [{ type: "strike" }];
        out.push(node);
        break;
      }
      case "image":
        break;
      case "pageRef":
        out.push({
          type: "pageReference",
          attrs: { label: span.label },
        });
        break;
      case "tag":
        out.push({
          type: "tag",
          attrs: { label: span.label, bracketed: span.bracketed },
        });
        break;
      case "blockRef":
        out.push({
          type: "blockReference",
          attrs: { id: span.id },
        });
        break;
      case "blockEmbed":
        out.push({
          type: "blockEmbed",
          attrs: { id: span.id },
        });
        break;
      default:
        break;
    }
  }
  return out;
}

function paragraphFromInlines(inlines: InlineSpan[]): PMNode {
  return {
    type: "paragraph",
    content: inlineToPm(inlines),
  };
}

function bulletsToList(nodes: BlockNode[]): PMNode | null {
  const items = nodes.filter((n) => n.type === "bullet");
  if (!items.length) return null;

  return {
    type: "bulletList",
    content: items.map((item) => {
      if (item.type !== "bullet") return { type: "listItem", content: [] };
      const childList = bulletsToList(item.children);
      const content: PMNode[] = [paragraphFromInlines(item.inlines)];
      if (childList) content.push(childList);
      return { type: "listItem", content };
    }),
  };
}

export function blockForestToTiptap(forest: BlockForest): PMNode {
  const content: PMNode[] = [];

  let bulletBatch: BlockNode[] = [];

  const flushBullets = () => {
    if (!bulletBatch.length) return;
    const list = bulletsToList(bulletBatch);
    if (list) content.push(list);
    bulletBatch = [];
  };

  for (const node of forest) {
    if (node.type === "bullet") {
      bulletBatch.push(node);
      continue;
    }
    flushBullets();
    if (node.type === "property") {
      content.push({
        type: "propertyBlock",
        attrs: { key: node.key, value: node.value },
      });
    } else if (node.type === "paragraph") {
      content.push(paragraphFromInlines(node.inlines));
    }
  }
  flushBullets();

  if (!content.length) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

import { parseLogseqMarkdown } from "./parser";

export function logseqMarkdownToTiptap(markdown: string): PMNode {
  return blockForestToTiptap(parseLogseqMarkdown(markdown));
}
