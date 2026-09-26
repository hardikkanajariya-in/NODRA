import { suggestLogseqAssetsPath } from "@/lib/logseq/assets-path-hints";

const IDB_NAME = "nodra-fs";
const IDB_STORE = "handles";
const LEGACY_IDB_KEY = "logseq-assets-handle";
const LEGACY_META_KEY = "nodra/logseq-assets-meta";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];

export const LOGSEQ_ASSETS_FOLDER_EVENT = "nodra:logseq-assets-folder";

export type LogseqAssetFolderStatus =
  | "unavailable"
  | "not_linked"
  | "denied"
  | "ready";

export type LogseqAssetsFolderMeta = {
  name: string;
  linkedAt: string;
  displayPath?: string;
};

function idbKeyForGraph(graphId: string): string {
  return `logseq-assets-handle:${graphId}`;
}

function metaKeyForGraph(graphId: string): string {
  return `nodra/logseq-assets-meta:${graphId}`;
}

/** Chromium limits `showDirectoryPicker` `id` to 32 characters. */
function directoryPickerIdForGraph(graphId: string): string {
  const hex = graphId.replace(/-/g, "");
  return `nodra-${hex.slice(0, 26)}`;
}

function notifyAssetsFolderChanged(graphId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LOGSEQ_ASSETS_FOLDER_EVENT, { detail: { graphId } }),
  );
}

export function isLogseqAssetPickerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
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

export function readLogseqAssetsMeta(
  graphId: string,
): LogseqAssetsFolderMeta | null {
  if (!graphId || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(metaKeyForGraph(graphId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LogseqAssetsFolderMeta;
    if (parsed?.name && parsed?.linkedAt) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeLogseqAssetsMeta(
  graphId: string,
  meta: LogseqAssetsFolderMeta | null,
) {
  if (!graphId || typeof localStorage === "undefined") return;
  const key = metaKeyForGraph(graphId);
  if (!meta) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(meta));
}

export function updateLogseqAssetsDisplayPath(
  graphId: string,
  displayPath: string,
): void {
  const existing = readLogseqAssetsMeta(graphId);
  if (!existing) return;
  writeLogseqAssetsMeta(graphId, {
    ...existing,
    displayPath: displayPath.trim() || undefined,
  });
  notifyAssetsFolderChanged(graphId);
}

export function linkedAssetsPathLabel(meta: LogseqAssetsFolderMeta | null): string | null {
  if (!meta) return null;
  if (meta.displayPath?.trim()) return meta.displayPath.trim();
  return meta.name ? meta.name : null;
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

async function idbGetRaw(key: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
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

async function idbDeleteRaw(key: string): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("IndexedDB delete failed"));
  });
}

async function migrateLegacyLinkIfNeeded(graphId: string): Promise<void> {
  const existing = await idbGetRaw(idbKeyForGraph(graphId));
  if (existing) return;

  const legacyHandle = await idbGetRaw(LEGACY_IDB_KEY);
  if (!legacyHandle) return;

  await idbSetHandle(graphId, legacyHandle);
  await idbDeleteRaw(LEGACY_IDB_KEY);

  if (typeof localStorage !== "undefined") {
    const legacyMetaRaw = localStorage.getItem(LEGACY_META_KEY);
    if (legacyMetaRaw) {
      localStorage.setItem(metaKeyForGraph(graphId), legacyMetaRaw);
      localStorage.removeItem(LEGACY_META_KEY);
    }
  }
}

async function idbGetHandle(
  graphId: string,
): Promise<FileSystemDirectoryHandle | null> {
  if (!graphId) return null;
  await migrateLegacyLinkIfNeeded(graphId);
  return idbGetRaw(idbKeyForGraph(graphId));
}

async function idbSetHandle(
  graphId: string,
  handle: FileSystemDirectoryHandle | null,
): Promise<void> {
  if (!graphId) return;
  const db = await openIdb();
  const key = idbKeyForGraph(graphId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req = handle ? store.put(handle, key) : store.delete(key);
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

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
  values?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
};

async function tryResolveDirectoryDisplayPath(
  handle: FileSystemDirectoryHandle,
): Promise<string | null> {
  const dir = handle as DirectoryHandleWithEntries;
  if (typeof dir.values !== "function") return null;

  try {
    for await (const [, entry] of dir.values()) {
      if (entry.kind !== "file") continue;
      const file = await (entry as FileSystemFileHandle).getFile();
      const path = (file as File & { path?: string }).path;
      if (typeof path === "string" && path.length > 0) {
        return path.replace(/[/\\][^/\\]+$/, "");
      }
      break;
    }
  } catch {
    // ignore
  }
  return null;
}

async function resolveDisplayPathForLink(
  pickedRoot: FileSystemDirectoryHandle,
  graphName: string,
): Promise<string> {
  const assetsDir = await resolveAssetsDir(pickedRoot);
  const fromProbe =
    (await tryResolveDirectoryDisplayPath(assetsDir)) ??
    (await tryResolveDirectoryDisplayPath(pickedRoot));
  if (fromProbe) return fromProbe;
  return suggestLogseqAssetsPath(graphName);
}

const cachedAssetsDir = new Map<
  string,
  { rootKey: string; dir: FileSystemDirectoryHandle }
>();

function clearCacheForGraph(graphId: string) {
  cachedAssetsDir.delete(graphId);
}

async function getLinkedAssetsDir(
  graphId: string,
): Promise<FileSystemDirectoryHandle | null> {
  if (!graphId) return null;
  const root = await idbGetHandle(graphId);
  if (!root) {
    clearCacheForGraph(graphId);
    return null;
  }
  const key = root.name;
  const cached = cachedAssetsDir.get(graphId);
  if (cached && cached.rootKey === key) return cached.dir;
  const assets = await resolveAssetsDir(root);
  cachedAssetsDir.set(graphId, { rootKey: key, dir: assets });
  return assets;
}

export async function getLogseqAssetFolderStatus(
  graphId: string,
): Promise<LogseqAssetFolderStatus> {
  if (!graphId) return "not_linked";
  if (!isLogseqAssetPickerSupported()) return "unavailable";
  const handle = await idbGetHandle(graphId);
  if (!handle) return "not_linked";
  const perm = await handle.queryPermission({ mode: "read" });
  if (perm === "granted") return "ready";
  return "denied";
}

export async function ensureLogseqAssetPermission(
  graphId: string,
): Promise<LogseqAssetFolderStatus> {
  if (!graphId) return "not_linked";
  if (!isLogseqAssetPickerSupported()) return "unavailable";
  const handle = await idbGetHandle(graphId);
  if (!handle) return "not_linked";
  let perm = await handle.queryPermission({ mode: "read" });
  if (perm === "prompt") {
    perm = await handle.requestPermission({ mode: "read" });
  }
  return perm === "granted" ? "ready" : "denied";
}

export async function linkLogseqAssetsFolder(
  graphId: string,
  graphName: string,
): Promise<LogseqAssetFolderStatus> {
  if (!graphId) return "not_linked";
  if (!isLogseqAssetPickerSupported()) return "unavailable";
  let root: FileSystemDirectoryHandle;
  try {
    root = await window.showDirectoryPicker({
      mode: "read",
      id: directoryPickerIdForGraph(graphId),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return getLogseqAssetFolderStatus(graphId);
    }
    throw error;
  }
  const displayPath = await resolveDisplayPathForLink(root, graphName);
  await idbSetHandle(graphId, root);
  clearCacheForGraph(graphId);
  writeLogseqAssetsMeta(graphId, {
    name: root.name,
    linkedAt: new Date().toISOString(),
    displayPath,
  });
  const perm = await root.requestPermission({ mode: "read" });
  const status = perm === "granted" ? "ready" : "denied";
  notifyAssetsFolderChanged(graphId);
  return status;
}

export async function unlinkLogseqAssetsFolder(graphId: string): Promise<void> {
  if (!graphId) return;
  await idbSetHandle(graphId, null);
  writeLogseqAssetsMeta(graphId, null);
  clearCacheForGraph(graphId);
  notifyAssetsFolderChanged(graphId);
}

export async function resolveLocalAssetFile(
  graphId: string,
  hint: string,
  url?: string,
): Promise<File | null> {
  const status = await ensureLogseqAssetPermission(graphId);
  if (status !== "ready") return null;

  const dir = await getLinkedAssetsDir(graphId);
  if (!dir) return null;

  const candidates = collectAssetFileCandidates(hint, url);
  for (const name of candidates) {
    const file = await readFileFromDir(dir, name);
    if (file) return file;
  }
  return null;
}

export function humanizeAssetsPath(path: string): string {
  return path
    .replace(/%USERPROFILE%/gi, "~")
    .replace(/%HOME%/gi, "~")
    .replace(/\\/g, "/");
}

/** Last path segments for compact display (e.g. `…/Smile Konnect/assets`). */
export function logseqAssetsPathTail(path: string, segmentCount = 2): string {
  const human = humanizeAssetsPath(path);
  const parts = human.split("/").filter(Boolean);
  if (parts.length === 0) return human;
  if (parts.length <= segmentCount) return parts.join("/");
  return `…/${parts.slice(-segmentCount).join("/")}`;
}

/** Short top-bar text (not the full filesystem path). */
export function logseqAssetsTopBarLabel(
  status: LogseqAssetFolderStatus,
  meta: LogseqAssetsFolderMeta | null,
): string {
  switch (status) {
    case "ready": {
      const path = linkedAssetsPathLabel(meta);
      if (path) {
        const tail = logseqAssetsPathTail(path, 3);
        return tail.length <= 28 ? tail : logseqAssetsPathTail(path, 2);
      }
      return meta?.name ? `Linked: ${meta.name}` : "Assets linked";
    }
    case "denied":
      return "Allow folder access";
    case "not_linked":
      return "Link assets folder";
    case "unavailable":
      return "Assets unavailable";
  }
}

export function logseqAssetsTopBarTitle(
  status: LogseqAssetFolderStatus,
  meta: LogseqAssetsFolderMeta | null,
): string {
  const path = linkedAssetsPathLabel(meta);
  const human = path ? humanizeAssetsPath(path) : null;
  switch (status) {
    case "ready":
      return human
        ? `Logseq assets folder on this device:\n${human}\n\nClick to open Settings.`
        : "Logseq assets folder is linked on this device.";
    case "denied":
      return human
        ? `Folder access expired:\n${human}\n\nClick to allow access again.`
        : "Allow folder access again.";
    case "not_linked":
      return "Link this graph's Logseq assets folder on this device.";
    default:
      return "Assets linking is not available in this browser.";
  }
}

export function logseqAssetsStatusLabel(
  status: LogseqAssetFolderStatus,
  meta: LogseqAssetsFolderMeta | null,
): string {
  switch (status) {
    case "ready": {
      const path = linkedAssetsPathLabel(meta);
      if (path) {
        return humanizeAssetsPath(path);
      }
      return "Assets linked";
    }
    case "denied":
      return "Assets access needed";
    case "not_linked":
      return "No assets folder";
    case "unavailable":
      return "Assets linking unavailable";
  }
}

export function logseqAssetsStatusTitle(
  status: LogseqAssetFolderStatus,
  meta: LogseqAssetsFolderMeta | null,
): string {
  const path = linkedAssetsPathLabel(meta);
  switch (status) {
    case "ready":
      return path
        ? `Assets folder linked on this device:\n${path}`
        : "Assets folder linked on this device";
    case "denied":
      return "Allow folder access again in Settings";
    case "not_linked":
      return "Link this graph's Logseq assets folder in Settings";
    default:
      return "Assets linking unavailable in this browser";
  }
}
