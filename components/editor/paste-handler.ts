import type { Editor } from "@tiptap/react";
import { buildImagePool } from "@/lib/logseq/clipboard-images";
import {
  prepareLogseqPaste,
  readClipboardStrings,
} from "@/lib/logseq/paste-to-tiptap";
import { uploadAssetFile } from "@/lib/assets/upload-client";
import { clearUploadProgress } from "@/lib/assets/upload-progress";

export type UploadHandlers = {
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onUploadProgress?: (percent: number) => void;
};

export function handleLogseqPaste(
  editor: Editor,
  event: ClipboardEvent,
  pageId: string,
  upload?: UploadHandlers,
): boolean {
  const clipboard = event.clipboardData;
  if (!clipboard) return false;

  const strings = readClipboardStrings(clipboard);
  const text = clipboard.getData("text/plain");
  const hasImageFile = [...clipboard.items].some(
    (i) => i.kind === "file" && i.type.startsWith("image/"),
  );
  const looksLogseq = strings.some(
    (s) =>
      s.includes(":pages-and-blocks") ||
      s.includes("\n- ") ||
      s.trim().startsWith("- ") ||
      s.includes("\n\t-") ||
      s.includes("~~") ||
      s.includes("<li"),
  );

  if (!looksLogseq && !hasImageFile && !text) return false;

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
    pool.ordered.length === 1 &&
    !clipboard.getData("text/plain") &&
    !clipboard.getData("text/html")
  ) {
    await uploadAndInsertImage(editor, pool.ordered[0], pageId, upload);
    return;
  }

  let started = false;
  try {
    const prepared = await prepareLogseqPaste(clipboard, pool);
    editor.chain().focus().insertContent(prepared.content).run();

    if (!prepared.jobs.length) return;

    started = true;
    upload?.onUploadStart?.();
    const total = prepared.jobs.length;
    const percents = new Array(total).fill(0);

    await Promise.all(
      prepared.jobs.map(async (job, index) => {
        try {
          const data = await uploadAssetFile(job.file, pageId, {
            uploadId: job.uploadId,
            onProgress: (percent) => {
              percents[index] = percent;
              const avg = Math.round(
                percents.reduce((sum, n) => sum + n, 0) / total,
              );
              upload?.onUploadProgress?.(avg);
            },
          });
          if (data) {
            replaceUploadedImage(editor, job.uploadId, {
              src: data.url,
              assetId: data.id,
            });
          } else {
            markUploadFailed(editor, job.uploadId);
          }
        } finally {
          URL.revokeObjectURL(job.previewUrl);
          clearUploadProgress(job.uploadId);
        }
      }),
    );
  } catch {
    editor.chain().focus().insertContent({ type: "paragraph" }).run();
  } finally {
    if (started) upload?.onUploadEnd?.();
  }
}

function replaceUploadedImage(
  editor: Editor,
  uploadId: string,
  attrs: { src: string; assetId: string },
) {
  const { state } = editor;
  let pos: number | null = null;
  state.doc.descendants((node, position) => {
    if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
      pos = position;
      return false;
    }
    return true;
  });
  if (pos == null) return;
  const node = state.doc.nodeAt(pos);
  if (!node) return;
  editor.view.dispatch(
    state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      src: attrs.src,
      assetId: attrs.assetId,
      uploading: false,
      uploadId: null,
    }),
  );
}

function markUploadFailed(editor: Editor, uploadId: string) {
  const { state } = editor;
  let pos: number | null = null;
  state.doc.descendants((node, position) => {
    if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
      pos = position;
      return false;
    }
    return true;
  });
  if (pos == null) return;
  const node = state.doc.nodeAt(pos);
  if (!node) return;
  editor.view.dispatch(
    state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      uploading: false,
      uploadFailed: true,
    }),
  );
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
  const uploadId = crypto.randomUUID();
  const previewUrl = URL.createObjectURL(file);
  upload?.onUploadStart?.();
  editor
    .chain()
    .focus()
    .insertContent({
      type: "image",
      attrs: {
        src: previewUrl,
        alt: file.name,
        align: "left",
        uploading: true,
        uploadId,
      },
    })
    .run();

  try {
    const data = await uploadAssetFile(file, pageId, {
      uploadId,
      onProgress: (percent) => upload?.onUploadProgress?.(percent),
    });
    if (!data) {
      markUploadFailed(editor, uploadId);
      return;
    }
    replaceUploadedImage(editor, uploadId, {
      src: data.url,
      assetId: data.id,
    });
  } catch {
    markUploadFailed(editor, uploadId);
  } finally {
    URL.revokeObjectURL(previewUrl);
    clearUploadProgress(uploadId);
    upload?.onUploadEnd?.();
  }
}
