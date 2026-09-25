const IDB_NAME = "nodra-fs";
const IDB_STORE = "handles";
const IDB_KEY = "logseq-assets-handle";
const META_KEY = "nodra/logseq-assets-meta";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];

export type LogseqAssetFolderStatus =
  | "unavailable"
  | "not_linked"
  | "denied"
  | "ready";

export type LogseqAssetsFolderMeta = {
  name: string;
  linkedAt: string;
};

export function isLogseqAssetPickerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.showDirectoryPicker === "function"
  );
}

/** Brave is Chromium but disables File System Access API unless a flag is set. */
export async function isBraveBrowser(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const brave = (
    navigator as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }
  ).brave;
  if (!brave?.isBrave) return false;
  try {
    return await brave.isBrave();
  } catch {
    return false;
  }
}

export function readLogseqAssetsMeta(): LogseqAssetsFolderMeta | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LogseqAssetsFolderMeta;
    if (parsed?.name && parsed?.linkedAt) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function writeLogseqAssetsMeta(meta: LogseqAssetsFolderMeta | null) {
  if (typeof localStorage === "undefined") return;
  if (!meta) {
    localStorage.removeItem(META_KEY);
    return;
  }
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

async function idbGetHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(IDB_KEY);
    req.onsuccess = () => {
      const value = req.result;
      resolve(
        value && typeof value === "object" && "getFileHandle" in value
          ? (value as FileSystemDirectoryHandle)
          : null,
      );
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
  });
}

async function idbSetHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = handle ? store.put(handle, IDB_KEY) : store.delete(IDB_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("IndexedDB write failed"));
  });
}

/** Strip query/hash and normalize path segments for Logseq asset references. */
export function normalizeAssetReference(ref: string): string {
  let s = ref.trim();
  if (!s) return "";
  try {
    if (/^https?:\/\//i.test(s) || /^file:/i.test(s)) {
      const u = new URL(s);
      s = u.pathname;
    }
  } catch {
    // keep as-is
  }
  s = s.replace(/\\/g, "/");
  s = s.replace(/^\.+\//, "");
  const assetsIdx = s.toLowerCase().lastIndexOf("/assets/");
  if (assetsIdx >= 0) {
    s = s.slice(assetsIdx + "/assets/".length);
  } else if (s.toLowerCase().startsWith("assets/")) {
    s = s.slice("assets/".length);
  }
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1]! : s;
}

/** Candidate filenames to try under the linked assets directory (testable). */
export function collectAssetFileCandidates(hint: string, url?: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (name: string) => {
    const n = name.trim();
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };

  const fromHint = normalizeAssetReference(hint);
  const fromUrl = url ? normalizeAssetReference(url) : "";

  if (fromHint) add(fromHint);
  if (fromUrl && fromUrl !== fromHint) add(fromUrl);

  const bases = [...out];
  for (const base of bases) {
    if (/\.[a-z0-9]+$/i.test(base)) continue;
    for (const ext of IMAGE_EXTENSIONS) {
      add(`${base}.${ext}`);
    }
  }

  return out.slice(0, 24);
}

async function resolveAssetsDir(
  root: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  if (root.name.toLowerCase() === "assets") return root;
  try {
    return await root.getDirectoryHandle("assets");
  } catch {
    return root;
  }
}

async function readFileFromDir(
  dir: FileSystemDirectoryHandle,
  fileName: string,
): Promise<File | null> {
  try {
    const handle = await dir.getFileHandle(fileName);
    return await handle.getFile();
  } catch {
    return null;
  }
}

let cachedAssetsDir: FileSystemDirectoryHandle | null = null;
let cachedRootKey: string | null = null;

async function getLinkedAssetsDir(): Promise<FileSystemDirectoryHandle | null> {
  const root = await idbGetHandle();
  if (!root) {
    cachedAssetsDir = null;
    cachedRootKey = null;
    return null;
  }
  const key = root.name;
  if (cachedAssetsDir && cachedRootKey === key) return cachedAssetsDir;
  const assets = await resolveAssetsDir(root);
  cachedAssetsDir = assets;
  cachedRootKey = key;
  return assets;
}

export async function getLogseqAssetFolderStatus(): Promise<LogseqAssetFolderStatus> {
  if (!isLogseqAssetPickerSupported()) return "unavailable";
  const handle = await idbGetHandle();
  if (!handle) return "not_linked";
  const perm = await handle.queryPermission({ mode: "read" });
  if (perm === "granted") return "ready";
  return "denied";
}

export async function ensureLogseqAssetPermission(): Promise<LogseqAssetFolderStatus> {
  if (!isLogseqAssetPickerSupported()) return "unavailable";
  const handle = await idbGetHandle();
  if (!handle) return "not_linked";
  let perm = await handle.queryPermission({ mode: "read" });
  if (perm === "prompt") {
    perm = await handle.requestPermission({ mode: "read" });
  }
  return perm === "granted" ? "ready" : "denied";
}

export async function linkLogseqAssetsFolder(): Promise<LogseqAssetFolderStatus> {
  if (!isLogseqAssetPickerSupported()) return "unavailable";
  let root: FileSystemDirectoryHandle;
  try {
    root = await window.showDirectoryPicker({ mode: "read" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return getLogseqAssetFolderStatus();
    }
    throw error;
  }
  await idbSetHandle(root);
  cachedAssetsDir = null;
  cachedRootKey = null;
  writeLogseqAssetsMeta({
    name: root.name,
    linkedAt: new Date().toISOString(),
  });
  const perm = await root.requestPermission({ mode: "read" });
  return perm === "granted" ? "ready" : "denied";
}

export async function unlinkLogseqAssetsFolder(): Promise<void> {
  await idbSetHandle(null);
  writeLogseqAssetsMeta(null);
  cachedAssetsDir = null;
  cachedRootKey = null;
}

export async function resolveLocalAssetFile(
  hint: string,
  url?: string,
): Promise<File | null> {
  const status = await ensureLogseqAssetPermission();
  if (status !== "ready") return null;

  const dir = await getLinkedAssetsDir();
  if (!dir) return null;

  const candidates = collectAssetFileCandidates(hint, url);
  for (const name of candidates) {
    const file = await readFileFromDir(dir, name);
    if (file) return file;
  }
  return null;
}
