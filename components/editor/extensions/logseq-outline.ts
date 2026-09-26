import { Extension, isAtStartOfNode } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, TextSelection } from "@tiptap/pm/state";

function listItemIsEmptyForBackspace(item: ProseMirrorNode): boolean {
  const paragraph = item.firstChild;
  if (paragraph?.type.name !== "paragraph" || paragraph.content.size > 0) {
    return false;
  }
  for (let i = 1; i < item.childCount; i++) {
    const child = item.child(i);
    if (child.type.name === "bulletList" || child.content.size > 0) {
      return false;
    }
  }
  return true;
}

function endOfListItemParagraph(
  listStart: number,
  list: ProseMirrorNode,
  itemIndex: number,
): number {
  let itemPos = listStart + 1;
  for (let i = 0; i < itemIndex; i++) {
    itemPos += list.child(i).nodeSize;
  }
  const item = list.child(itemIndex);
  const paragraph = item.firstChild;
  if (paragraph?.type.name === "paragraph") {
    return itemPos + 1 + paragraph.content.size;
  }
  return itemPos + 1;
}

/** Keep typing inside bullet lists (Logseq outliner). */
export const LogseqOutline = Extension.create({
  name: "logseqOutline",

  addProseMirrorPlugins() {
    const { schema } = this.editor;
    const bulletList = schema.nodes.bulletList;
    const listItem = schema.nodes.listItem;
    const paragraph = schema.nodes.paragraph;
    if (!bulletList || !listItem || !paragraph) return [];

    return [
      new Plugin({
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const wraps: {
            from: number;
            to: number;
            node: ReturnType<typeof bulletList.create>;
          }[] = [];
          newState.doc.forEach((node, offset) => {
            if (node.type !== paragraph) return;
            const from = offset + 1;
            const to = from + node.nodeSize;
            const item = listItem.create(null, node);
            wraps.push({
              from,
              to,
              node: bulletList.create(null, item),
            });
          });

          if (!wraps.length) return null;

          let tr = newState.tr;
          for (let i = wraps.length - 1; i >= 0; i--) {
            const { from, to, node } = wraps[i];
            tr = tr.replaceWith(from, to, node);
          }
          return tr;
        },
      }),
    ];
  },

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

      "Mod-Shift-8": ({ editor }) => {
        if (editor.isActive("bulletList")) return true;
        return editor.chain().focus().toggleBulletList().run();
      },

      Backspace: ({ editor }) => {
        const { state } = editor;
        if (!isAtStartOfNode(state)) return false;
        if (!editor.isActive("listItem")) return false;

        const { $from } = state.selection;
        let listItemDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "listItem") {
            listItemDepth = d;
            break;
          }
        }
        if (listItemDepth < 0) return false;

        const item = $from.node(listItemDepth);
        if (!listItemIsEmptyForBackspace(item)) return false;

        const listDepth = listItemDepth - 1;
        if (listDepth < 0 || $from.node(listDepth).type.name !== "bulletList") {
          return false;
        }

        const list = $from.node(listDepth);
        const indexInList = $from.index(listDepth);

        if (list.childCount <= 1) return true;

        if (indexInList === 0) return false;

        const itemFrom = $from.before(listItemDepth);
        const itemTo = $from.after(listItemDepth);
        const listStart = $from.before(listDepth);
        const focusPos = endOfListItemParagraph(
          listStart,
          list,
          indexInList - 1,
        );

        const tr = state.tr.delete(itemFrom, itemTo);
        const mappedFocus = tr.mapping.map(focusPos, -1);
        tr.setSelection(TextSelection.create(tr.doc, mappedFocus));
        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});
