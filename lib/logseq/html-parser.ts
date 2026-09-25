import type { BlockForest, BlockNode } from "./types";
import { parseBulletContent } from "./bullet-content";
import { parseLogseqMarkdown } from "./parser";

export type HtmlParseResult = {
  forest: BlockForest;
  /** img src values from HTML (for upload when not in file pool) */
  htmlImageSrcs: string[];
};

export function parseLogseqHtml(html: string): HtmlParseResult {
  const htmlImageSrcs: string[] = [];
  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const img of doc.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (src) htmlImageSrcs.push(src);
  }

  const rootList =
    doc.body.querySelector("ul") ?? doc.querySelector("ul");

  if (rootList) {
    const forest = walkList(rootList, 0);
    if (forest.length > 0) {
      return { forest, htmlImageSrcs };
    }
  }

  const blocks = doc.body.querySelectorAll(".block, [class*='block']");
  if (blocks.length > 0) {
    const forest: BlockForest = [];
    blocks.forEach((el) => {
      const text = elementTextWithImages(el);
      if (!text.trim()) return;
      const { inlines, done, imageHint } = parseBulletContent(text);
      if (imageHint) {
        forest.push({
          type: "bullet",
          depth: 0,
          inlines: [],
          children: [],
          done: false,
          imageHint,
        });
      } else {
        forest.push({
          type: "bullet",
          depth: 0,
          inlines,
          children: [],
          done,
        });
      }
    });
    if (forest.length) return { forest, htmlImageSrcs };
  }

  const plain = htmlToPlainPreserveStructure(html);
  return {
    forest: parseLogseqMarkdown(plain),
    htmlImageSrcs,
  };
}

function walkList(ul: Element, depth: number): BlockForest {
  const forest: BlockForest = [];

  for (const li of ul.children) {
    if (li.tagName !== "LI") continue;
    const node = parseListItem(li as HTMLLIElement, depth);
    if (node) forest.push(node);
  }

  return forest;
}

function parseListItem(li: HTMLLIElement, depth: number): BlockNode | null {
  const clone = li.cloneNode(true) as HTMLLIElement;
  for (const nested of clone.querySelectorAll(":scope > ul")) {
    nested.remove();
  }

  const img = li.querySelector(":scope > img, :scope > p > img, :scope img");
  let imageHint: string | undefined;
  if (img) {
    const alt = (img.getAttribute("alt") || "").trim();
    const src = img.getAttribute("src") || "";
    const base = src.split(/[/\\]/).pop() ?? "";
    const stem = base.replace(/\.[^.]+$/, "");
    if (/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/i.test(stem)) {
      imageHint = stem;
    } else if (/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/i.test(alt)) {
      imageHint = alt;
    } else {
      imageHint = alt || stem || "image";
    }
  }

  const text = elementTextWithImages(clone);
  const { inlines, done, imageHint: textHint } = parseBulletContent(text);
  const hint = imageHint ?? textHint;

  const childUl = li.querySelector(":scope > ul");
  const children = childUl ? walkList(childUl, depth + 1) : [];

  if (hint && !inlines.some((s) => s.type === "text" && s.text.trim())) {
    return {
      type: "bullet",
      depth,
      inlines: [],
      children,
      done: false,
      imageHint: hint,
    };
  }

  return {
    type: "bullet",
    depth,
    inlines,
    children,
    done,
    imageHint: hint,
  };
}

function elementTextWithImages(el: Element): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.tagName === "IMG") {
      const alt = el.getAttribute("alt") || "";
      const src = el.getAttribute("src") || "";
      out += ` ![image](${src || alt}) `;
      return;
    }
    if (el.tagName === "S" || el.tagName === "STRIKE" || el.tagName === "DEL") {
      out += "~~";
      for (const c of el.childNodes) walk(c);
      out += "~~";
      return;
    }
    if (el.tagName === "BR") {
      out += "\n";
      return;
    }
    for (const c of el.childNodes) walk(c);
  };
  for (const c of el.childNodes) walk(c);
  return out.replace(/\s+/g, " ").trim();
}

function htmlToPlainPreserveStructure(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<img[^>]+alt="([^"]*)"[^>]*>/gi, " ![image]($1) ")
    .replace(/<img[^>]+src="([^"]*)"[^>]*>/gi, " ![image]($1) ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}
