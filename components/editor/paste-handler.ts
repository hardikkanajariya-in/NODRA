import type { Editor } from "@tiptap/react";
import { buildImagePool } from "@/lib/logseq/clipboard-images";
import {
  ensureLogseqAssetPermission,
  resolveLocalAssetFile,
} from "@/lib/logseq/local-asset-folder";
import {
  prepareLogseqPaste,
  readClipboardStrings,
} from "@/lib/logseq/paste-to-tiptap";
import { uploadAssetFile } from "@/lib/assets/upload-client";
import { clearUploadProgress } from "@/lib/assets/upload-progress";
import {
  listItemsFromPaste,
  outlinePasteRange,
  type JsonNode,
} from "@/lib/editor/insert-outline-paste";
import { insertImageNode } from "./insert-image";

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
  void processPaste(editor, clipboard, pageId, upload, hasImageFile);
  return true;
}

function isLogseqStructuredPaste(clipboard: DataTransfer): boolean {
  const text = clipboard.getData("text/plain");
  const html = clipboard.getData("text/html");
  if (text.includes(":pages-and-blocks")) return true;
  if (text.includes("~~")) return true;
  if (text.includes("\n- ") || text.trim().startsWith("- ") || text.includes("\n\t-")) {
    return true;
  }
  if (html && /<li[\s>]/i.test(html)) return true;
  return false;
}

async function processPaste(
  editor: Editor,
  clipboard: DataTransfer,
  pageId: string,
  upload?: UploadHandlers,
  hasClipboardImages = false,
) {
  const pool = await buildImagePool(clipboard);

  const structured = isLogseqStructuredPaste(clipboard);
  if (hasClipboardImages && pool.ordered.length > 0 && !structured) {
    upload?.onUploadStart?.();
    try {
      for (const file of pool.ordered) {
        await uploadAndInsertImage(editor, file, pageId, upload, {
          manageUploadLifecycle: false,
        });
      }
    } finally {
      upload?.onUploadEnd?.();
    }
    return;
  }

  let folderReady = false;
  try {
    folderReady = (await ensureLogseqAssetPermission()) === "ready";
  } catch {
    folderReady = false;
  }

  let prepared;
  try {
    prepared = await prepareLogseqPaste(clipboard, pool, {
      resolveLocalFile: folderReady ? resolveLocalAssetFile : undefined,
    });
  } catch {
    return;
  }

  if (!insertPreparedContent(editor, prepared.content)) return;
  if (!prepared.jobs.length) return;

  upload?.onUploadStart?.();
  try {
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
        } catch {
          markUploadFailed(editor, job.uploadId);
        } finally {
          URL.revokeObjectURL(job.previewUrl);
          clearUploadProgress(job.uploadId);
        }
      }),
    );
  } finally {
    upload?.onUploadEnd?.();
  }
}

function insertPreparedContent(editor: Editor, content: JsonNode[]): boolean {
  const items = listItemsFromPaste(content);
  const range = items
    ? outlinePasteRange(editor.state.doc, editor.state.selection.from)
    : null;
  if (items && range) {
    return editor.chain().focus().insertContentAt(range, items).run();
  }
  return editor.chain().focus().insertContent(content).run();
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
  options?: { manageUploadLifecycle?: boolean },
) {
  const manageLifecycle = options?.manageUploadLifecycle ?? true;
  const uploadId = crypto.randomUUID();
  const previewUrl = URL.createObjectURL(file);
  if (manageLifecycle) upload?.onUploadStart?.();
  insertImageNode(editor, {
    src: previewUrl,
    alt: file.name,
    align: "left",
    uploading: true,
    uploadId,
  });

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
    if (manageLifecycle) upload?.onUploadEnd?.();
  }
}
