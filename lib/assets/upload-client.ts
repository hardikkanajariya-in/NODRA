import { publishUploadProgress } from "./upload-progress";

export type UploadedAsset = {
  id: string;
  url: string;
};

export type UploadOptions = {
  onProgress?: (percent: number) => void;
  uploadId?: string;
};

/** Multipart upload phase — leave room for server → R2 processing. */
const UPLOAD_PHASE_MAX = 88;
const PROCESSING_PERCENT = 96;

function createProgressReporter(options?: UploadOptions) {
  let last = 0;

  const report = (percent: number) => {
    const clamped = Math.max(last, Math.min(100, Math.round(percent)));
    if (clamped === last && clamped !== 100) return;
    last = clamped;
    options?.onProgress?.(clamped);
    if (options?.uploadId) {
      publishUploadProgress(options.uploadId, clamped);
    }
  };

  return report;
}

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
    const report = createProgressReporter(options);

    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let sawComputedProgress = false;
    let fallbackEstimate = 2;

    const stopFallback = () => {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const startFallback = () => {
      if (fallbackTimer) return;
      fallbackTimer = setInterval(() => {
        if (sawComputedProgress) return;
        fallbackEstimate = Math.min(UPLOAD_PHASE_MAX - 4, fallbackEstimate + 3);
        report(fallbackEstimate);
      }, 400);
    };

    xhr.upload.onloadstart = () => {
      report(2);
      startFallback();
    };

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      sawComputedProgress = true;
      stopFallback();
      const ratio = event.loaded / event.total;
      report(2 + ratio * (UPLOAD_PHASE_MAX - 2));
    };

    xhr.onloadstart = () => {
      stopFallback();
      report(PROCESSING_PERCENT);
    };

    xhr.onload = () => {
      stopFallback();
      if (xhr.status < 200 || xhr.status >= 300) {
        resolve(null);
        return;
      }
      try {
        report(100);
        resolve(JSON.parse(xhr.responseText) as UploadedAsset);
      } catch {
        resolve(null);
      }
    };

    xhr.onerror = () => {
      stopFallback();
      resolve(null);
    };
    xhr.onabort = () => {
      stopFallback();
      resolve(null);
    };

    xhr.open("POST", "/api/assets");
    xhr.send(form);
  });
}
