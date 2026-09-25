import { Node, mergeAttributes } from "@tiptap/core";

export const TagMark = Node.create({
  name: "tag",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: { default: "" },
      bracketed: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-tag]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes.label as string;
    const bracketed = HTMLAttributes.bracketed as boolean;
    const text = bracketed ? `#[[${label}]]` : `#${label}`;
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-tag": "",
        class: "nodra-tag",
      }),
      text,
    ];
  },
});
