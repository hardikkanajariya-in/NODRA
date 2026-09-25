import type { Editor } from "@tiptap/react";

export type ImageAttrs = Record<string, unknown>;

export function insertImageNode(editor: Editor, attrs: ImageAttrs): boolean {
  const imageNode = { type: "image", attrs };
  const { state } = editor;
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name !== "listItem") continue;
    const insertPos = $from.end(depth);
    return editor
      .chain()
      .focus()
      .insertContentAt(insertPos, imageNode)
      .run();
  }

  if (editor.chain().focus().insertContent(imageNode).run()) {
    return true;
  }

  return editor
    .chain()
    .focus()
    .insertContent({
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph" }, imageNode],
        },
      ],
    })
    .run();
}
