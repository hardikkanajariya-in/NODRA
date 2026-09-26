"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Italic,
  Quote,
  RemoveFormatting,
  Strikethrough,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type StoredSelection = { from: number; to: number };

function restoreSelection(editor: Editor, stored: StoredSelection | null) {
  if (stored && stored.from !== stored.to) {
    editor.chain().focus().setTextSelection(stored).run();
  } else {
    editor.commands.focus();
  }
}

function toggleListQuote(editor: Editor) {
  if (!editor.isActive("listItem")) return;
  const quoted = !!editor.getAttributes("listItem").quoted;
  editor.chain().focus().updateAttributes("listItem", { quoted: !quoted }).run();
}

function clearTextFormatting(editor: Editor) {
  const { empty } = editor.state.selection;
  if (empty) {
    editor
      .chain()
      .focus()
      .unsetMark("bold", { extendEmptyMarkRange: true })
      .unsetMark("italic", { extendEmptyMarkRange: true })
      .unsetMark("strike", { extendEmptyMarkRange: true })
      .unsetMark("code", { extendEmptyMarkRange: true })
      .run();
  } else {
    editor.chain().focus().unsetAllMarks().run();
  }
  if (editor.isActive("listItem") && editor.getAttributes("listItem").quoted) {
    editor.chain().focus().updateAttributes("listItem", { quoted: false }).run();
  }
}

type MenuState = {
  open: boolean;
  x: number;
  y: number;
};

const MENU_WIDTH = 280;
const MENU_HEIGHT = 44;
const OFFSET = 8;

type FormatAction = {
  id: string;
  label: string;
  icon: typeof Bold;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const FORMAT_ACTIONS: FormatAction[] = [
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => {
      editor.chain().focus().toggleBold().run();
    },
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => {
      editor.chain().focus().toggleItalic().run();
    },
  },
  {
    id: "strike",
    label: "Strikethrough",
    icon: Strikethrough,
    isActive: (editor) => editor.isActive("strike"),
    run: (editor) => {
      editor.chain().focus().toggleStrike().run();
    },
  },
  {
    id: "code",
    label: "Inline code",
    icon: Code,
    isActive: (editor) => editor.isActive("code"),
    run: (editor) => {
      editor.chain().focus().toggleCode().run();
    },
  },
  {
    id: "blockquote",
    label: "Quote",
    icon: Quote,
    isActive: (editor) =>
      editor.isActive("listItem") && !!editor.getAttributes("listItem").quoted,
    run: (editor) => {
      toggleListQuote(editor);
    },
  },
  {
    id: "clear",
    label: "Clear formatting",
    icon: RemoveFormatting,
    isActive: () => false,
    run: (editor) => {
      clearTextFormatting(editor);
    },
  },
];

function clampMenuPosition(x: number, y: number) {
  const maxX = window.innerWidth - MENU_WIDTH - OFFSET;
  const maxY = window.innerHeight - MENU_HEIGHT - OFFSET;
  return {
    left: Math.max(OFFSET, Math.min(x, maxX)),
    top: Math.max(OFFSET, Math.min(y, maxY)),
  };
}

type Props = {
  editor: Editor | null;
};

export function EditorFormatContextMenu({ editor }: Props) {
  const [menu, setMenu] = useState<MenuState>({
    open: false,
    x: 0,
    y: 0,
  });
  const [, bump] = useState(0);
  const storedSelectionRef = useRef<StoredSelection | null>(null);

  const close = useCallback(() => {
    setMenu((current) => (current.open ? { ...current, open: false } : current));
  }, []);

  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom;

    const onContextMenu = (event: MouseEvent) => {
      if (!editor.isEditable) return;
      event.preventDefault();
      event.stopPropagation();
      const { from, to } = editor.state.selection;
      storedSelectionRef.current = from !== to ? { from, to } : null;
      editor.commands.focus();
      if (storedSelectionRef.current) {
        editor.commands.setTextSelection(storedSelectionRef.current);
      }
      setMenu({
        open: true,
        x: event.clientX + OFFSET,
        y: event.clientY + OFFSET,
      });
    };

    dom.addEventListener("contextmenu", onContextMenu);
    return () => dom.removeEventListener("contextmenu", onContextMenu);
  }, [editor]);

  useEffect(() => {
    if (!editor || !menu.open) return;

    const refresh = () => bump((n) => n + 1);
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor, menu.open]);

  useEffect(() => {
    if (!menu.open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".nodra-editor-format-menu")) return;
      close();
    };
    const onScroll = () => close();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menu.open, close]);

  if (!editor || !menu.open) return null;

  const { left, top } = clampMenuPosition(menu.x, menu.y);

  return (
    <div
      className="nodra-editor-format-menu fixed z-[200] flex items-center gap-0.5 rounded-lg border p-1 shadow-lg"
      style={{ left, top }}
      role="toolbar"
      aria-label="Text formatting"
      onContextMenu={(event) => event.preventDefault()}
    >
      {FORMAT_ACTIONS.map((action) => {
        const Icon = action.icon;
        const active = action.isActive(editor);
        const showDivider =
          action.id === "code" || action.id === "blockquote";

        return (
          <span key={action.id} className="flex items-center">
            {showDivider ? (
              <span className="nodra-editor-format-menu-divider" aria-hidden />
            ) : null}
            <button
              type="button"
              className="nodra-editor-format-menu-btn"
              title={action.label}
              aria-label={action.label}
              aria-pressed={active}
              onMouseDown={(event) => {
                event.preventDefault();
                restoreSelection(editor, storedSelectionRef.current);
                action.run(editor);
              }}
            >
              <Icon size={16} strokeWidth={2.25} />
            </button>
          </span>
        );
      })}
    </div>
  );
}
