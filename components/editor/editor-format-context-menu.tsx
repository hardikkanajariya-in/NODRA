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
import { useCallback, useEffect, useState } from "react";

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
    isActive: (editor) => editor.isActive("blockquote"),
    run: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    id: "clear",
    label: "Clear formatting",
    icon: RemoveFormatting,
    isActive: () => false,
    run: (editor) => {
      editor.chain().focus().unsetAllMarks().run();
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
      editor.commands.focus();
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
