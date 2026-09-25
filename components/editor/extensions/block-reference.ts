import { Node, mergeAttributes } from "@tiptap/core";

export const BlockReference = Node.create({
  name: "blockReference",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-block-ref]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-block-ref": "",
        class: "nodra-block-ref",
      }),
      "↗ Referenced block",
    ];
  },
});

export const BlockEmbed = Node.create({
  name: "blockEmbed",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-block-embed]' }];
  },

  renderHTML() {
    return [
      "span",
      {
        "data-block-embed": "",
        class: "nodra-block-embed",
      },
      "[Embedded block]",
    ];
  },
});
