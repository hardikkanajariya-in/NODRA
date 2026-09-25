import type { BlockForest, BlockNode, InlineSpan } from "./types";
import { parseLogseqMarkdown } from "./parser";
import { parseLogseqHtml } from "./html-parser";
import type { ImagePool } from "./clipboard-images";
import {
  findImageForHint,
  takeNextPoolImage,
} from "./clipboard-images";
import { normalizePastedForest } from "./forest-normalize";
import { parseLogseqDbClipboard } from "./db-clipboard";

type PMNode = Record<string, unknown>;

export type PendingAssetUpload = {
  uploadId: string;
  file: File;
  previewUrl: string;
};

export type PreparedPaste = {
  content: PMNode[];
  jobs: PendingAssetUpload[];
};

export type PrepareLogseqPasteOptions = {
  resolveLocalFile?: (hint: string, url?: string) => Promise<File | null>;
};

export function readClipboardStrings(clipboard: DataTransfer): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const types = new Set(clipboard.types);
  types.add("text/plain");
  types.add("text/html");
  for (const type of types) {
    if (type.startsWith("image/")) continue;
    let data = "";
    try {
      data = clipboard.getData(type);
    } catch {
      continue;
    }
    if (!data || seen.has(data)) continue;
    seen.add(data);
    out.push(data);
  }
  return out;
}

export async function prepareLogseqPaste(
  clipboard: DataTransfer,
  pool: ImagePool,
  options?: PrepareLogseqPasteOptions,
): Promise<PreparedPaste> {
  const resolveLocalFile = options?.resolveLocalFile;
  const strings = readClipboardStrings(clipboard);
  const html = clipboard.getData("text/html");
  const text = clipboard.getData("text/plain");
  const edn = strings.find((s) => s.includes(":pages-and-blocks"));

  let forest: BlockForest | null = null;
  let htmlImageSrcs: string[] = [];

  if (edn) {
    forest = parseLogseqDbClipboard(edn);
  }
  if ((!forest || forest.length === 0) && html?.trim()) {
    const parsed = parseLogseqHtml(html);
    forest = parsed.forest;
    htmlImageSrcs = parsed.htmlImageSrcs;
  }
  if ((!forest || forest.length === 0) && looksLikeMarkdown(text)) {
    forest = parseLogseqMarkdown(text);
  }
  if (!forest || forest.length === 0) {
    return { content: [{ type: "paragraph" }], jobs: [] };
  }

  forest = normalizePastedForest(forest);

  const jobs: PendingAssetUpload[] = [];
  let imageIndex = 0;
  let htmlSrcIndex = 0;
  const usedFiles = new Set<string>();

  const resolveImage = async (
    hint: string,
    url?: string,
    displayWidth?: number,
  ): Promise<PMNode | null> => {
    let file = findImageForHint(pool, hint);
    if (!file) file = findImageForHint(pool, `${hint}.png`);
    if (file && usedFiles.has(file.name)) {
      file = pool.ordered.find((f) => !usedFiles.has(f.name));
    }
    if (!file && url?.startsWith("data:")) {
      file =
        (await fileFromImageSrc(url, `${hint || "image"}.png`)) ?? undefined;
    }
    if (!file && pool.ordered[imageIndex] && !usedFiles.has(pool.ordered[imageIndex].name)) {
      file = pool.ordered[imageIndex];
      imageIndex++;
    }
    if (!file && htmlImageSrcs[htmlSrcIndex]) {
      const src = htmlImageSrcs[htmlSrcIndex];
      htmlSrcIndex++;
      file =
        (await fileFromImageSrc(src, `${hint || "image"}.png`)) ?? undefined;
    }
    if (!file && resolveLocalFile) {
      file = (await resolveLocalFile(hint, url)) ?? undefined;
    }
    if (!file) file = takeNextPoolImage(pool, usedFiles);
    if (!file) return null;

    usedFiles.add(file.name);
    const uploadId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    jobs.push({ uploadId, file, previewUrl });

    return {
      type: "image",
      attrs: {
        src: previewUrl,
        alt: hint,
        align: "left",
        width: displayWidth ?? null,
        caption: LOGSEQ_ASSET.test(hint) ? hint : null,
        uploading: true,
        uploadId,
      },
    };
  };

  const content = await forestToPm(forest, resolveImage);
  return { content, jobs };
}

function looksLikeMarkdown(text: string): boolean {
  if (!text) return false;
  return (
    text.includes("\n- ") ||
    text.trim().startsWith("- ") ||
    text.includes("\n\t-") ||
    text.includes("~~")
  );
}

async function forestToPm(
  forest: BlockForest,
  resolveImage: (
    hint: string,
    url?: string,
    displayWidth?: number,
  ) => Promise<PMNode | null>,
): Promise<PMNode[]> {
  const content: PMNode[] = [];
  let bulletBatch: BlockNode[] = [];

  const flushBullets = async () => {
    if (!bulletBatch.length) return;
    const list = await bulletsToList(bulletBatch, resolveImage);
    if (list) content.push(list);
    bulletBatch = [];
  };

  for (const node of forest) {
    if (node.type === "bullet") {
      bulletBatch.push(node);
      continue;
    }
    await flushBullets();
    if (node.type === "property") {
      content.push({
        type: "propertyBlock",
        attrs: { key: node.key, value: node.value },
      });
    } else if (node.type === "paragraph") {
      content.push({
        type: "paragraph",
        content: inlineToPm(node.inlines),
      });
    }
  }
  await flushBullets();
  if (!content.length) content.push({ type: "paragraph" });
  return content;
}

async function bulletsToList(
  nodes: BlockNode[],
  resolveImage: (
    hint: string,
    url?: string,
    displayWidth?: number,
  ) => Promise<PMNode | null>,
): Promise<PMNode | null> {
  const items = nodes.filter((n) => n.type === "bullet");
  if (!items.length) return null;

  const content: PMNode[] = [];
  for (const item of items) {
    if (item.type !== "bullet") continue;
    const childList = await bulletsToList(item.children, resolveImage);
    const listItemContent: PMNode[] = [];

    if (item.inlines.length || item.done) {
      listItemContent.push({
        type: "paragraph",
        content: inlineToPm(
          item.done
            ? item.inlines.map((span) =>
                span.type === "text" && !span.strike
                  ? { ...span, strike: true }
                  : span,
              )
            : item.inlines,
        ),
      });
    }

    if (item.imageHint) {
      const imageSpan = item.inlines.find((s) => s.type === "image");
      const url = imageSpan?.type === "image" ? imageSpan.url : undefined;
      const img = await resolveImage(item.imageHint, url, item.imageWidth);
      if (img) {
        listItemContent.push(img);
      } else if (!item.inlines.some((s) => s.type === "text" && s.text.trim())) {
        listItemContent.push({
          type: "paragraph",
          content: [{ type: "text", text: item.imageHint }],
        });
      }
    }

    if (!item.imageHint) {
      for (const span of item.inlines) {
        if (span.type === "image") {
          const img = await resolveImage(span.alt || "image", span.url);
          if (img) listItemContent.push(img);
        }
      }
    }

    if (!listItemContent.length) {
      listItemContent.push({ type: "paragraph" });
    }

    if (childList) listItemContent.push(childList);

    content.push({ type: "listItem", content: listItemContent });
  }

  return { type: "bulletList", content };
}

function inlineToPm(spans: InlineSpan[]): PMNode[] {
  const out: PMNode[] = [];
  for (const span of spans) {
    switch (span.type) {
      case "text": {
        const node: PMNode = { type: "text", text: span.text };
        if (span.strike) {
          node.marks = [{ type: "strike" }];
        }
        if (span.text) out.push(node);
        break;
      }
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
      case "image":
        break;
      default:
        break;
    }
  }
  return out;
}

const LOGSEQ_ASSET = /^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})(\.[a-z0-9]+)?$/i;

async function fileFromImageSrc(
  src: string,
  name: string,
): Promise<File | null> {
  if (
    !src.startsWith("data:") &&
    !src.startsWith("blob:") &&
    !src.startsWith("http")
  ) {
    return null;
  }
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || "image/png" });
  } catch {
    return null;
  }
}
