import type { BlockForest, BlockNode } from "./types";
import { parseBulletContent } from "./bullet-content";

type BulletNode = Extract<BlockNode, { type: "bullet" }>;

function isBullet(node: BlockNode): node is BulletNode {
  return node.type === "bullet";
}

/** Logseq paste often omits `-` on the first line but keeps tab-indented children. */
export function normalizePastedForest(forest: BlockForest): BlockForest {
  if (forest.length < 2) return forest;

  const first = forest[0];
  if (first.type !== "paragraph") return forest;

  let bulletStart = 1;
  while (bulletStart < forest.length && !isBullet(forest[bulletStart])) {
    bulletStart++;
  }
  if (bulletStart >= forest.length) return forest;

  const flatBullets = forest.slice(bulletStart).filter(isBullet);
  if (!flatBullets.length) return forest;

  const minDepth = Math.min(...flatBullets.map((b) => b.depth));
  const joined = first.inlines
    .map((s) => (s.type === "text" ? s.text : ""))
    .join("")
    .trim();
  const parsed = joined ? parseBulletContent(joined) : null;

  const parent: BulletNode = {
    type: "bullet",
    depth: 0,
    inlines: first.inlines.length
      ? first.inlines
      : (parsed?.inlines ?? [{ type: "text", text: "" }]),
    done: parsed?.done,
    children: nestBulletsByDepth(
      flatBullets.map((b) => ({
        ...b,
        depth: Math.max(0, b.depth - minDepth),
      })),
    ),
  };

  const tail = forest.slice(bulletStart + flatBullets.length);
  return [parent, ...tail];
}

function nestBulletsByDepth(flat: BulletNode[]): BlockNode[] {
  const forest: BlockNode[] = [];
  const stack: { depth: number; node: BulletNode }[] = [];

  for (const raw of flat) {
    const node: BulletNode = {
      ...raw,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      forest.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth: node.depth, node });
  }

  return forest;
}
