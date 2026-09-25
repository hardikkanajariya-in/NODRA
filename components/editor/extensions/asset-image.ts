import Image from "@tiptap/extension-image";

export const AssetImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: {
        default: null,
      },
    };
  },
});
