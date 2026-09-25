"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useRouter } from "next/navigation";
import { PageReference } from "./extensions/page-reference";
import { TagMark } from "./extensions/tag";
import { BlockReference, BlockEmbed } from "./extensions/block-reference";
import { PropertyBlock } from "./extensions/property-block";
import { AssetImage } from "./extensions/asset-image";
import { LogseqListItem } from "./extensions/logseq-list-item";
import { handleLogseqPaste, uploadFileToEditor } from "./paste-handler";
import { pageSlugFromName } from "@/lib/utils/slug";
import { useAppActivity } from "@/components/shell/app-activity-context";

type Props = {
  pageId: string;
  initialContent: Record<string, unknown>;
  variant?: "page" | "journal";
};

export function LogseqEditor({
  pageId,
  initialContent,
  variant = "page",
}: Props) {
  const router = useRouter();
  const { setSaveStatus, setLastSaved, beginUpload, endUpload, setUploadProgress } =
    useAppActivity();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uploadHandlers = {
    onUploadStart: beginUpload,
    onUploadEnd: endUpload,
    onUploadProgress: setUploadProgress,
  };

  const persist = useCallback(
    async (json: Record<string, unknown>) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/documents/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentJson: json }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          setLastSaved(new Date());
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    },
    [pageId, setSaveStatus, setLastSaved],
  );

  const scheduleSave = useCallback(
    (json: Record<string, unknown>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(json), 800);
    },
    [persist],
  );

  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const proseClass =
    variant === "journal"
      ? "nodra-editor-prose nodra-editor-journal focus:outline-none"
      : "nodra-editor-prose nodra-editor-page focus:outline-none min-h-[50vh]";

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: false,
        listItem: false,
      }),
      LogseqListItem,
      TaskList.configure({
        HTMLAttributes: { class: "nodra-task-list" },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "nodra-task-item" },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or paste from Logseq…",
      }),
      PageReference,
      TagMark,
      BlockReference,
      BlockEmbed,
      PropertyBlock,
      AssetImage,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: proseClass,
      },
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target as HTMLElement;
          const ref = target.closest("[data-page-ref]") as HTMLElement | null;
          if (ref) {
            const label = ref.textContent?.replace(/^\[\[|\]\]$/g, "") ?? "";
            void navigateToPage(label, router);
            return true;
          }
          const tag = target.closest("[data-tag]") as HTMLElement | null;
          if (tag) {
            const raw = tag.textContent ?? "";
            const label = raw.replace(/^#\[\[|\]\]$/g, "").replace(/^#/, "");
            void navigateToPage(label, router);
            return true;
          }
          return false;
        },
        paste: (_view, event) => {
          const ed = editorRef.current;
          if (!ed) return false;
          return handleLogseqPaste(ed, event, pageId, uploadHandlers);
        },
        drop: (view, event) => {
          const ed = editorRef.current;
          if (!ed || !event.dataTransfer?.files?.length) return false;
          const file = [...event.dataTransfer.files].find((f) =>
            f.type.startsWith("image/"),
          );
          if (!file) return false;
          event.preventDefault();
          void uploadFileToEditor(ed, file, pageId, uploadHandlers);
          return true;
        },
      },
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
    onUpdate: ({ editor: ed }) => {
      scheduleSave(ed.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="nodra-editor-wrap relative">
      <EditorContent editor={editor} />
    </div>
  );
}

async function navigateToPage(
  name: string,
  router: ReturnType<typeof useRouter>,
) {
  const slug = pageSlugFromName(name);
  const res = await fetch(`/api/pages/by-slug/${encodeURIComponent(slug)}`);
  if (res.ok) {
    router.push(`/pages/${slug}`);
    return;
  }

  const create = await fetch("/api/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (create.ok) {
    const page = (await create.json()) as { slug: string };
    router.push(`/pages/${page.slug}`);
  }
}
