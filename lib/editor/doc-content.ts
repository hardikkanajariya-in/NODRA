import { extractPlainTextFromTiptap } from "@/lib/links/extract";

export function journalDocumentHasContent(
  doc: Record<string, unknown>,
): boolean {
  if (extractPlainTextFromTiptap(doc).trim()) return true;
  return JSON.stringify(doc).includes('"type":"image"');
}
