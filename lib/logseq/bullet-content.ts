import type { InlineSpan } from "./types";
import { parseInline } from "./inline-parser";

const LOGSEQ_ASSET_NAME =
  /^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})(\.[a-z0-9]+)?$/i;

export function parseBulletContent(raw: string): {
  inlines: InlineSpan[];
  done: boolean;
  imageHint?: string;
} {
  let text = raw.trim();
  let done = false;

  if (/^DONE\s+/i.test(text)) {
    done = true;
    text = text.replace(/^DONE\s+/i, "");
  }

  const fullStrike = text.match(/^~~(.+)~~$/);
  if (fullStrike) {
    done = true;
    text = fullStrike[1];
    const inlines = parseInline(text).map((span) =>
      span.type === "text" ? { ...span, strike: true } : span,
    );
    return { inlines, done };
  }

  if (LOGSEQ_ASSET_NAME.test(text)) {
    return { inlines: [], done: false, imageHint: text };
  }

  if (!text && raw.includes("![image]")) {
    return { inlines: parseInline(raw), done, imageHint: "image" };
  }

  return { inlines: parseInline(text), done };
}
