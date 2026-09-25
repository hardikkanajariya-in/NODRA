import { publishUploadProgress } from "./upload-progress";

export type UploadedAsset = {
  id: string;
  url: string;
};

export type UploadOptions = {
  onProgress?: (percent: number) => void;
  uploadId?: string;
};

export function uploadAssetFile(
  file: File,
  pageId: string,
  options?: UploadOptions,
): Promise<UploadedAsset | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("pageId", pageId);

    xhr.open("POST", "/api/assets");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(
        99,
        Math.round((event.loaded / event.total) * 100),
      );
      options?.onProgress?.(percent);
      if (options?.uploadId) {
        publishUploadProgress(options.uploadId, percent);
      }
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        resolve(null);
        return;
      }
      try {
        options?.onProgress?.(100);
        if (options?.uploadId) publishUploadProgress(options.uploadId, 100);
        resolve(JSON.parse(xhr.responseText) as UploadedAsset);
      } catch {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.send(form);
  });
}
