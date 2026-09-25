"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useRouter } from "next/navigation";
import { PageReference } from "./extensions/page-reference";
import { TagMark } from "./extensions/tag";
import { BlockReference, BlockEmbed } from "./extensions/block-reference";
import { PropertyBlock } from "./extensions/property-block";
import { AssetImage } from "./extensions/asset-image";
import { handleLogseqPaste } from "./paste-handler";
import { pageSlugFromName } from "@/lib/utils/slug";
import { useSaveStatus } from "@/components/shell/save-status-context";

type Props = {
  pageId: string;
  initialContent: Record<string, unknown>;
};

export function LogseqEditor({ pageId, initialContent }: Props) {
  const router = useRouter();
  const { setStatus, setLastSaved } = useSaveStatus();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (json: Record<string, unknown>) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentJson: json }),
        });
        if (res.ok) {
          setStatus("saved");
          setLastSaved(new Date());
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    },
    [pageId, setStatus, setLastSaved],
  );

  const scheduleSave = useCallback(
    (json: Record<string, unknown>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(json), 800);
    },
    [persist],
  );

  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
      }),
      Placeholder.configure({
        placeholder: "Write something, or paste from Logseq…",
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
        class: "nodra-editor-prose focus:outline-none min-h-[60vh]",
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
          return handleLogseqPaste(ed, event, pageId);
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

  return <EditorContent editor={editor} />;
}

async function navigateToPage(
  name: string,
  router: ReturnType<typeof useRouter>,
) {
  const slug = pageSlugFromName(name);
  const res = await fetch(`/api/pages/by-slug/${encodeURIComponent(slug)}`);
  if (res.ok) {
    router.push(`/page/${slug}`);
    return;
  }

  const create = await fetch("/api/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (create.ok) {
    const page = (await create.json()) as { slug: string };
    router.push(`/page/${page.slug}`);
  }
}
