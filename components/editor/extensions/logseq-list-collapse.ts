import { Extension } from "@tiptap/core";
import type { CommandProps } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";

const collapsePluginKey = new PluginKey("logseqListCollapse");

function listItemHasNestedList(node: ProseMirrorNode): boolean {
  for (let i = 0; i < node.childCount; i++) {
    if (node.child(i).type.name === "bulletList") return true;
  }
  return false;
}

function transactionSetAllListCollapse(
  state: EditorState,
  collapsed: boolean,
): Transaction | null {
  const { tr } = state;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (node.type.name !== "listItem") return;
    if (!listItemHasNestedList(node)) return;
    if (Boolean(node.attrs.collapsed) === collapsed) return;
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      collapsed,
    });
    changed = true;
  });

  return changed ? tr : null;
}

export const LogseqListCollapse = Extension.create({
  name: "logseqListCollapse",

  addCommands() {
    return {
      collapseAllNestedBlocks:
        () =>
        ({ state, dispatch }: CommandProps) => {
          const tr = transactionSetAllListCollapse(state, true);
          if (!tr) return false;
          dispatch?.(tr);
          return true;
        },
      expandAllNestedBlocks:
        () =>
        ({ state, dispatch }: CommandProps) => {
          const tr = transactionSetAllListCollapse(state, false);
          if (!tr) return false;
          dispatch?.(tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: collapsePluginKey,
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              if (node.type.name !== "listItem") return;
              if (!listItemHasNestedList(node)) return;

              const collapsed = Boolean(node.attrs.collapsed);
              decorations.push(
                Decoration.widget(
                  pos + 1,
                  (view) => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "nodra-list-collapse";
                    btn.setAttribute(
                      "aria-label",
                      collapsed ? "Expand nested blocks" : "Collapse nested blocks",
                    );
                    btn.setAttribute(
                      "aria-expanded",
                      collapsed ? "false" : "true",
                    );
                    btn.dataset.collapsed = collapsed ? "true" : "false";
                    btn.tabIndex = -1;
                    btn.addEventListener("mousedown", (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const current = view.state.doc.nodeAt(pos);
                      if (!current) return;
                      const tr = view.state.tr.setNodeMarkup(pos, undefined, {
                        ...current.attrs,
                        collapsed: !current.attrs.collapsed,
                      });
                      view.dispatch(tr);
                    });
                    return btn;
                  },
                  {
                    side: -1,
                    key: `collapse-${pos}-${collapsed ? "1" : "0"}`,
                  },
                ),
              );
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
