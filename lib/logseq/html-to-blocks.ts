import type { BlockForest } from "./types";
import { parseLogseqHtml } from "./html-parser";

/** @deprecated use parseLogseqHtml */
export function htmlToLogseqForest(html: string): BlockForest {
  return parseLogseqHtml(html).forest;
}
