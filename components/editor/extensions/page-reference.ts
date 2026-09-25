import { Node, mergeAttributes } from "@tiptap/core";

export const PageReference = Node.create({
  name: "pageReference",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-page-ref]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-page-ref": "",
        class: "nodra-page-ref",
      }),
      `[[${HTMLAttributes.label}]]`,
    ];
  },
});
