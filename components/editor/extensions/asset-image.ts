import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AssetImageView } from "./asset-image-view";

export const AssetImage = Image.extend({
  name: "image",

  group: "block",

  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: {
        default: null,
      },
      align: {
        default: "left",
      },
      width: {
        default: null,
      },
      caption: {
        default: null,
      },
      uploading: {
        default: false,
      },
      uploadId: {
        default: null,
      },
      uploadFailed: {
        default: false,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssetImageView);
  },
});
