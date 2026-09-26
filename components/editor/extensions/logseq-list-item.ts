import { ListItem } from "@tiptap/extension-list";
import { mergeAttributes } from "@tiptap/core";

/** Allow block images inside nested bullets (Logseq-style). */
export const LogseqListItem = ListItem.extend({
  content: "paragraph block*",

  addAttributes() {
    return {
      ...this.parent?.(),
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-collapsed") === "true",
        renderHTML: (attributes) =>
          attributes.collapsed ? { "data-collapsed": "true" } : {},
      },
      quoted: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-quoted") === "true",
        renderHTML: (attributes) =>
          attributes.quoted ? { "data-quoted": "true" } : {},
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "nodra-list-item",
      }),
      0,
    ];
  },
});
