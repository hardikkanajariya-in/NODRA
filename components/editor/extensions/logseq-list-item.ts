import { ListItem } from "@tiptap/extension-list";

/** Allow block images inside nested bullets (Logseq-style). */
export const LogseqListItem = ListItem.extend({
  content: "paragraph block*",
});
