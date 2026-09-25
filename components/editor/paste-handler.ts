import type { Editor } from "@tiptap/react";
import { buildImagePool } from "@/lib/logseq/clipboard-images";
import { pasteClipboardToTiptap } from "@/lib/logseq/paste-to-tiptap";
import { uploadAssetFile } from "@/lib/assets/upload-client";

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

  const html = clipboard.getData("text/html");
  const text = clipboard.getData("text/plain");
  const hasImageFile = [...clipboard.items].some(
    (i) => i.kind === "file" && i.type.startsWith("image/"),
  );
  const looksLogseq =
    Boolean(html?.trim()) ||
    text?.includes("\n- ") ||
    text?.trim().startsWith("- ") ||
    text?.includes("\n\t-") ||
    text?.includes("~~");

  if (!looksLogseq && !hasImageFile) return false;

  event.preventDefault();
  void processPaste(editor, clipboard, pageId, upload);
  return true;
}

async function processPaste(
  editor: Editor,
  clipboard: DataTransfer,
  pageId: string,
  upload?: UploadHandlers,
) {
  const pool = await buildImagePool(clipboard);

  if (
    pool.ordered.length === 0 &&
    !clipboard.getData("text/html") &&
    !clipboard.getData("text/plain").includes("-")
  ) {
    const file = [...clipboard.files].find((f) => f.type.startsWith("image/"));
    if (file) {
      await uploadAndInsertImage(editor, file, pageId, upload);
      return;
    }
  }

  try {
    const doc = await pasteClipboardToTiptap(
      clipboard,
      pageId,
      pool,
      upload,
    );
    editor.chain().focus().insertContent(doc.content ?? []).run();
  } catch {
    editor.chain().focus().insertContent({ type: "paragraph" }).run();
  }
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
  try {
    const data = await uploadAssetFile(file, pageId);
    if (!data) {
      editor
        .chain()
        .focus()
        .insertContent(`![${file.name}](file://local)`)
        .run();
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: data.url,
          alt: file.name,
          assetId: data.id,
          align: "left",
        },
      })
      .run();
  } catch {
    editor
      .chain()
      .focus()
      .insertContent(`![${file.name}](file://local)`)
      .run();
  } finally {
    upload?.onUploadEnd?.();
  }
}
