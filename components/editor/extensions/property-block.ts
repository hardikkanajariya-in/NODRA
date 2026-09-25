import { Node, mergeAttributes } from "@tiptap/core";

export const PropertyBlock = Node.create({
  name: "propertyBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      key: { default: "" },
      value: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-property]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const key = HTMLAttributes.key as string;
    const value = HTMLAttributes.value as string;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-property": "",
        class: "nodra-property",
      }),
      ["span", { class: "nodra-property-key" }, `${key}::`],
      " ",
      ["span", { class: "nodra-property-value" }, value],
    ];
  },
});
