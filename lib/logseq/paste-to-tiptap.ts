import type { BlockForest, BlockNode, InlineSpan } from "./types";
import { parseLogseqMarkdown } from "./parser";
import { parseLogseqHtml } from "./html-parser";
import type { ImagePool } from "./clipboard-images";
import { findImageForHint } from "./clipboard-images";
import { uploadAssetFile } from "@/lib/assets/upload-client";

type PMNode = Record<string, unknown>;

export type PasteUploadHooks = {
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
};

export async function pasteClipboardToTiptap(
  clipboard: DataTransfer,
  pageId: string,
  pool: ImagePool,
  upload?: PasteUploadHooks,
): Promise<PMNode> {
  const html = clipboard.getData("text/html");
  const text = clipboard.getData("text/plain");

  let forest: BlockForest;
  let htmlImageSrcs: string[] = [];

  if (html?.trim()) {
    const parsed = parseLogseqHtml(html);
    forest = parsed.forest;
    htmlImageSrcs = parsed.htmlImageSrcs;
  } else if (text?.includes("\n- ") || text?.trim().startsWith("- ")) {
    forest = parseLogseqMarkdown(text);
  } else {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  let imageIndex = 0;
  const usedFiles = new Set<string>();
  const resolveImage = async (
    hint: string,
    url?: string,
  ): Promise<PMNode | null> => {
    upload?.onUploadStart?.();
    try {
      let file = findImageForHint(pool, hint);
      if (file && usedFiles.has(file.name)) {
        file =
          pool.ordered.find((f) => !usedFiles.has(f.name)) ?? file;
      }
      if (!file && url?.startsWith("data:")) {
        const res = await fetch(url);
        const blob = await res.blob();
        file = new File([blob], hint || `image-${imageIndex}.png`, {
          type: blob.type,
        });
      }
      if (!file && pool.ordered[imageIndex]) {
        file = pool.ordered[imageIndex];
        imageIndex++;
      }
      if (!file && htmlImageSrcs[imageIndex]?.startsWith("data:")) {
        const src = htmlImageSrcs[imageIndex];
        imageIndex++;
        const res = await fetch(src);
        const blob = await res.blob();
        file = new File([blob], hint || `image-${imageIndex}.png`, {
          type: blob.type,
        });
      }
      if (!file) return null;
      usedFiles.add(file.name);

      const uploaded = await uploadAssetFile(file, pageId);
      if (!uploaded) return null;
      return {
        type: "image",
        attrs: {
          src: uploaded.url,
          alt: hint,
          assetId: uploaded.id,
        },
      };
    } finally {
      upload?.onUploadEnd?.();
    }
  };

  const content = await forestToPm(forest, resolveImage);
  return { type: "doc", content };
}

async function forestToPm(
  forest: BlockForest,
  resolveImage: (hint: string, url?: string) => Promise<PMNode | null>,
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
  resolveImage: (hint: string, url?: string) => Promise<PMNode | null>,
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
      const img = await resolveImage(item.imageHint, url);
      if (img) listItemContent.push(img);
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
