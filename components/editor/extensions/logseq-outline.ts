import { Extension } from "@tiptap/core";

/** Keep typing inside bullet lists (Logseq outliner). */
export const LogseqOutline = Extension.create({
  name: "logseqOutline",

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (editor.isActive("listItem")) return false;
        if (editor.isActive("taskItem")) return false;

        if (editor.isActive("paragraph")) {
          editor.chain().focus().toggleBulletList().run();
          return true;
        }
        return false;
      },
    };
  },
});
