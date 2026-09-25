import type { BlockForest, BlockNode } from "./types";
import { parseBulletContent } from "./bullet-content";

type RawBlock = {
  title: string;
  asset: boolean;
  assetType?: string;
  displayWidth?: number;
  children: RawBlock[];
};

const ASSET_NAME = /^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})$/;

/** Logseq DB “copy blocks” payload (`:pages-and-blocks`). */
export function parseLogseqDbClipboard(input: string): BlockForest | null {
  if (!input.includes(":pages-and-blocks") || !input.includes(":block/title")) {
    return null;
  }

  const blocksIdx = input.indexOf(":blocks");
  if (blocksIdx < 0) return null;
  const listStart = input.indexOf("[", blocksIdx);
  if (listStart < 0) return null;

  const { blocks } = readBlockList(input, listStart);
  if (!blocks.length) return null;

  return blocks.map((b) => toBullet(b, 0));
}

function toBullet(block: RawBlock, depth: number): BlockNode {
  const parsed = parseBulletContent(block.title);
  const hint = block.asset
    ? block.title
    : parsed.imageHint;
  const assetOnly = Boolean(hint && ASSET_NAME.test(block.title.trim()));

  return {
    type: "bullet",
    depth,
    inlines: assetOnly ? [] : parsed.inlines,
    children: block.children.map((c) => toBullet(c, depth + 1)),
    done: assetOnly ? false : parsed.done,
    imageHint: hint,
    imageWidth: block.displayWidth,
  };
}

function readBlockList(
  input: string,
  openBracket: number,
): { blocks: RawBlock[]; end: number } {
  const blocks: RawBlock[] = [];
  let i = openBracket + 1;

  while (i < input.length) {
    i = skipSpace(input, i);
    if (input[i] === "]") return { blocks, end: i + 1 };
    if (input[i] !== "{") {
      i++;
      continue;
    }
    const end = matchingBrace(input, i);
    if (end < 0) break;
    const body = input.slice(i + 1, end);
    blocks.push(readBlock(body));
    i = end + 1;
  }

  return { blocks, end: i };
}

function readBlock(body: string): RawBlock {
  const own = ownProps(body);
  const title = readStringProp(own, ":block/title") ?? "";
  const asset =
    own.includes(":logseq.class/Asset") || own.includes("logseq.class/Asset");
  const assetType = readStringProp(own, ":logseq.property.asset/type");
  const displayWidth = readResizeWidth(own);

  const children: RawBlock[] = [];
  const childKey = body.indexOf(":build/children");
  if (childKey >= 0) {
    const bracket = body.indexOf("[", childKey);
    if (bracket >= 0) {
      children.push(...readBlockList(body, bracket).blocks);
    }
  }

  return { title, asset, assetType, displayWidth, children };
}

function readStringProp(body: string, key: string): string | undefined {
  const idx = body.indexOf(key);
  if (idx < 0) return undefined;
  const slice = body.slice(idx + key.length);
  const m = slice.match(/^\s*"((?:\\.|[^"\\])*)"/);
  return m ? m[1].replace(/\\"/g, '"') : undefined;
}

function readResizeWidth(body: string): number | undefined {
  const key = ":logseq.property.asset/resize-metadata";
  const idx = body.indexOf(key);
  if (idx < 0) return undefined;
  const slice = body.slice(idx, idx + 200);
  const m = slice.match(/:width\s+([0-9.]+)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function matchingBrace(input: string, open: number): number {
  let depth = 0;
  let quote = false;
  for (let i = open; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === "\\" ) {
        i++;
        continue;
      }
      if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') {
      quote = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function ownProps(body: string): string {
  const childKey = body.indexOf(":build/children");
  return childKey >= 0 ? body.slice(0, childKey) : body;
}

function skipSpace(input: string, i: number): number {
  while (i < input.length && /\s/.test(input[i])) i++;
  return i;
}
