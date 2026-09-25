import type { Editor } from "@tiptap/react";
import { blockForestToTiptap } from "@/lib/logseq/to-tiptap";
import { parseLogseqMarkdown } from "@/lib/logseq/parser";
import { htmlToLogseqForest } from "@/lib/logseq/html-to-blocks";

export type UploadHandlers = {
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
};

export function handleLogseqPaste(
  editor: Editor,
  event: ClipboardEvent,
  pageId: string,
  upload?: UploadHandlers,
): boolean {
  const clipboard = event.clipboardData;
  if (!clipboard) return false;

  const files = [...clipboard.files];
  const imageFile = files.find((f) => f.type.startsWith("image/"));
  if (imageFile) {
    event.preventDefault();
    void uploadAndInsertImage(editor, imageFile, pageId, upload);
    return true;
  }

  const html = clipboard.getData("text/html");
  if (html?.trim()) {
    event.preventDefault();
    const forest = htmlToLogseqForest(html);
    const doc = blockForestToTiptap(forest);
    editor.commands.insertContent(doc.content ?? []);
    return true;
  }

  const text = clipboard.getData("text/plain");
  if (text?.includes("\n- ") || text?.trim().startsWith("- ")) {
    event.preventDefault();
    const doc = blockForestToTiptap(parseLogseqMarkdown(text));
    editor.commands.insertContent(doc.content ?? []);
    return true;
  }

  return false;
}

export async function uploadFileToEditor(
  editor: Editor,
  file: File,
  pageId: string,
  upload?: UploadHandlers,
) {
  await uploadAndInsertImage(editor, file, pageId, upload);
}

async function uploadAndInsertImage(
  editor: Editor,
  file: File,
  pageId: string,
  upload?: UploadHandlers,
) {
  upload?.onUploadStart?.();

  const form = new FormData();
  form.append("file", file);
  form.append("pageId", pageId);

  try {
    const res = await fetch("/api/assets", { method: "POST", body: form });
    if (!res.ok) {
      editor.chain().focus().insertContent(`![${file.name}](file://local)`).run();
      return;
    }
    const data = (await res.json()) as { id: string; url: string };
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: { src: data.url, alt: file.name, assetId: data.id },
      })
      .run();
  } catch {
    editor.chain().focus().insertContent(`![${file.name}](file://local)`).run();
  } finally {
    upload?.onUploadEnd?.();
  }
}
