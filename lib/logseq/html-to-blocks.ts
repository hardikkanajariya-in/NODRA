import { parseLogseqMarkdown } from "./parser";
import type { BlockForest } from "./types";

export function htmlToLogseqForest(html: string): BlockForest {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

  if (text.includes("\n- ") || text.startsWith("- ")) {
    return parseLogseqMarkdown(text);
  }

  const lines = text.split("\n").filter(Boolean);
  if (!lines.length) return [];

  return parseLogseqMarkdown(lines.map((l) => `- ${l}`).join("\n"));
}
