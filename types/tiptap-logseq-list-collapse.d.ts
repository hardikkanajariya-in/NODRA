import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    logseqListCollapse: {
      collapseAllNestedBlocks: () => ReturnType;
      expandAllNestedBlocks: () => ReturnType;
    };
  }
}
