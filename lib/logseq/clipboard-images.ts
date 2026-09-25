const LOGSEQ_ASSET_NAME =
  /^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})(\.[a-z0-9]+)?$/i;

export type ImagePool = {
  byName: Map<string, File>;
  ordered: File[];
};

export async function buildImagePool(
  clipboard: DataTransfer,
): Promise<ImagePool> {
  const byName = new Map<string, File>();
  const ordered: File[] = [];

  const add = (file: File) => {
    ordered.push(file);
    byName.set(file.name, file);
    const base = file.name.replace(/\.[^.]+$/, "");
    if (!byName.has(base)) byName.set(base, file);
  };

  for (const file of [...clipboard.files]) {
    if (file.type.startsWith("image/")) add(file);
  }

  for (const item of [...clipboard.items]) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) add(file);
    }
  }

  const html = clipboard.getData("text/html");
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const imgs = doc.querySelectorAll("img");
    let i = 0;
    for (const img of imgs) {
      const src = img.getAttribute("src");
      if (!src) continue;
      if (src.startsWith("data:")) {
        const alt = (img.getAttribute("alt") || "").trim();
        const name =
          alt && LOGSEQ_ASSET_NAME.test(alt)
            ? alt.includes(".")
              ? alt
              : `${alt}.png`
            : alt || `pasted-image-${i}.png`;
        const file = await dataUrlToFile(src, name);
        if (file) add(file);
        i++;
      } else if (src.startsWith("blob:")) {
        try {
          const blob = await fetch(src).then((r) => r.blob());
          const file = new File([blob], `pasted-image-${i}.png`, {
            type: blob.type || "image/png",
          });
          add(file);
          i++;
        } catch {
          // blob URL not readable
        }
      }
    }
  }

  return { byName, ordered };
}

export function takeNextPoolImage(
  pool: ImagePool,
  used: Set<string>,
): File | undefined {
  return pool.ordered.find((f) => !used.has(f.name));
}

export function findImageForHint(
  pool: ImagePool,
  hint: string,
): File | undefined {
  const trimmed = hint.trim();
  if (pool.byName.has(trimmed)) return pool.byName.get(trimmed);

  const base = trimmed.replace(/\.[^.]+$/, "");
  if (pool.byName.has(base)) return pool.byName.get(base);

  if (LOGSEQ_ASSET_NAME.test(trimmed)) {
    for (const [name, file] of pool.byName) {
      if (name.startsWith(trimmed) || name.includes(trimmed)) return file;
    }
    if (pool.ordered.length === 1) return pool.ordered[0];
  }

  return undefined;
}

async function dataUrlToFile(
  dataUrl: string,
  name: string,
): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || "image/png" });
  } catch {
    return null;
  }
}
