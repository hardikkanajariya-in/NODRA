import type { BlockForest, BlockNode } from "./types";
import { parseInline } from "./inline-parser";

const BULLET = /^(\s*)-\s+(.*)$/;
const PROPERTY = /^(\s*)([^:\s]+)::\s*(.+)$/;

function indentDepth(indent: string): number {
  const expanded = indent.replace(/\t/g, "  ");
  return Math.floor(expanded.length / 2);
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
      forest.push({
        type: "paragraph",
        inlines: parseInline(line.trim()),
      });
      continue;
    }

    const depth = indentDepth(bulletMatch[1]);
    const node: BlockNode = {
      type: "bullet",
      depth,
      inlines: parseInline(bulletMatch[2]),
      children: [],
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
