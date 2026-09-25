import type { BlockForest, BlockNode } from "./types";
import { parseBulletContent } from "./bullet-content";

const BULLET = /^([\t ]*)-\s+(.*)$/;
const PROPERTY = /^(\s*)([^:\s]+)::\s*(.+)$/;

function indentDepth(indent: string): number {
  let depth = 0;
  for (const ch of indent) {
    if (ch === "\t") depth += 1;
    else if (ch === " ") depth += 0.5;
  }
  return Math.floor(depth);
}

export function parseLogseqMarkdown(input: string): BlockForest {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const forest: BlockForest = [];
  const stack: { depth: number; node: BlockNode }[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const propMatch = line.match(PROPERTY);
    if (propMatch && !line.match(BULLET)) {
      forest.push({
        type: "property",
        key: propMatch[2].trim(),
        value: propMatch[3].trim(),
      });
      continue;
    }

    const bulletMatch = line.match(BULLET);
    if (!bulletMatch) {
      const para = parseBulletContent(line.trim());
      forest.push({
        type: "paragraph",
        inlines: para.inlines,
      });
      continue;
    }

    const depth = indentDepth(bulletMatch[1]);
    const parsed = parseBulletContent(bulletMatch[2]);
    const node: BlockNode = {
      type: "bullet",
      depth,
      inlines: parsed.inlines,
      children: [],
      done: parsed.done,
      imageHint: parsed.imageHint,
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      forest.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      if (parent.type === "bullet") {
        parent.children.push(node);
      }
    }

    stack.push({ depth, node });
  }

  return forest;
}
