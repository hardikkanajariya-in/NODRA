"use client";

import { useEffect, useMemo, useState } from "react";
import { typicalLogseqAssetsPathHints } from "@/lib/logseq/assets-path-hints";
import {
  ensureLogseqAssetPermission,
  getLogseqAssetFolderStatus,
  isBraveBrowser,
  isLogseqAssetPickerSupported,
  linkLogseqAssetsFolder,
  linkedAssetsPathLabel,
  readLogseqAssetsMeta,
  unlinkLogseqAssetsFolder,
  updateLogseqAssetsDisplayPath,
  type LogseqAssetFolderStatus,
  type LogseqAssetsFolderMeta,
} from "@/lib/logseq/local-asset-folder";

type Props = {
  graphId: string;
  graphName: string;
};

export function LogseqAssetsLink({ graphId, graphName }: Props) {
  const [status, setStatus] = useState<LogseqAssetFolderStatus>("not_linked");
  const [meta, setMeta] = useState<LogseqAssetsFolderMeta | null>(null);
  const [pathDraft, setPathDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [braveNeedsFlag, setBraveNeedsFlag] = useState(false);
  const [pickerSupported, setPickerSupported] = useState<boolean | null>(null);

  const pathHints = useMemo(
    () => typicalLogseqAssetsPathHints(graphName),
    [graphName],
  );

  useEffect(() => {
    if (!graphId) return;
    void (async () => {
      const supported = isLogseqAssetPickerSupported();
      setPickerSupported(supported);
      const nextMeta = readLogseqAssetsMeta(graphId);
      setMeta(nextMeta);
      setPathDraft(linkedAssetsPathLabel(nextMeta) ?? "");
      setStatus(await getLogseqAssetFolderStatus(graphId));
      if (!supported && (await isBraveBrowser())) {
        setBraveNeedsFlag(true);
      }
    })();
  }, [graphId]);

  async function onLink() {
    if (!graphId) return;
    setBusy(true);
    try {
      const next = await linkLogseqAssetsFolder(graphId, graphName);
      setStatus(next);
      const nextMeta = readLogseqAssetsMeta(graphId);
      setMeta(nextMeta);
      setPathDraft(linkedAssetsPathLabel(nextMeta) ?? "");
    } catch {
      // Non-abort failures are rare; keep current UI state
    } finally {
      setBusy(false);
    }
  }

  async function onReauthorize() {
    if (!graphId) return;
    setBusy(true);
    try {
      const next = await ensureLogseqAssetPermission(graphId);
      setStatus(next);
    } finally {
      setBusy(false);
    }
  }

  async function onUnlink() {
    if (!graphId) return;
    setBusy(true);
    try {
      await unlinkLogseqAssetsFolder(graphId);
      setStatus("not_linked");
      setMeta(null);
      setPathDraft("");
    } finally {
      setBusy(false);
    }
  }

  function saveDisplayPath() {
    if (!graphId) return;
    updateLogseqAssetsDisplayPath(graphId, pathDraft);
    setMeta(readLogseqAssetsMeta(graphId));
  }

  const supported = pickerSupported === true;
  const linked = status === "ready";
  const needsPermission = status === "denied";
  const connectedPath = linkedAssetsPathLabel(meta);

  if (!graphId) {
    return (
      <p className="text-sm text-[var(--nodra-muted)]">
        Open a graph to link its Logseq assets folder.
      </p>
    );
  }

  return (
    <section
      className="rounded-md border border-[var(--nodra-border)] px-4 py-4"
      aria-labelledby="logseq-assets-heading"
    >
      <h2
        id="logseq-assets-heading"
        className="text-sm font-semibold tracking-tight"
      >
        Logseq assets folder
      </h2>
      <p className="mt-2 text-sm text-[var(--nodra-muted)]">
        For graph <span className="font-medium text-[var(--nodra-fg)]">{graphName}</span>.
        When you paste from Logseq Desktop, images are referenced by filename
        but not copied into the clipboard. Link this graph&apos;s{" "}
        <code className="text-[12px]">assets</code> folder on{" "}
        <strong>this device</strong> so NODRA can read those files locally
        (nothing is uploaded except through normal image paste). Each graph has
        its own link; other devices must link again.
      </p>
      <div className="mt-2 space-y-1 text-xs text-[var(--nodra-muted)]">
        <p>Typical locations on this system:</p>
        {pathHints.map((hint) => (
          <code key={hint} className="block text-[11px]">
            {hint}
          </code>
        ))}
      </div>

      {pickerSupported === null && (
        <p className="mt-3 text-xs text-[var(--nodra-muted)]">
          Checking browser support…
        </p>
      )}

      {pickerSupported === false && braveNeedsFlag && (
        <div className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          <p>
            Brave uses Chromium, but it turns off the folder picker API by
            default. Enable{" "}
            <code className="text-[12px]">brave://flags/#file-system-access-api</code>
            , set it to <strong>Enabled</strong>, then relaunch Brave and reload
            this page.
          </p>
        </div>
      )}
      {pickerSupported === false && !braveNeedsFlag && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Folder linking needs a browser that exposes{" "}
          <code className="text-[12px]">showDirectoryPicker</code> (Chrome,
          Edge, or Brave with the File System Access flag).
        </p>
      )}

      {supported && connectedPath && (linked || needsPermission) && (
        <div className="mt-4 rounded-md bg-[var(--nodra-bg)] px-3 py-2">
          <p className="text-xs font-medium text-[var(--nodra-muted)]">
            Connected path (this device)
          </p>
          <p className="mt-1 break-all font-mono text-[12px] text-[var(--nodra-fg)]">
            {connectedPath}
          </p>
          <label className="mt-2 block text-xs text-[var(--nodra-muted)]">
            Adjust label if the browser did not detect the full path
            <input
              className="nodra-input mt-1 w-full font-mono text-[12px]"
              value={pathDraft}
              onChange={(e) => setPathDraft(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="mt-2 rounded border border-[var(--nodra-border)] px-2 py-1 text-xs"
            onClick={saveDisplayPath}
            disabled={!pathDraft.trim()}
          >
            Save path label
          </button>
        </div>
      )}

      {supported && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!linked && !needsPermission && (
            <button
              type="button"
              className="nodra-new-page-btn rounded-lg px-3 py-2 text-[13px] font-medium"
              onClick={() => void onLink()}
              disabled={busy}
            >
              Link assets folder
            </button>
          )}
          {(linked || needsPermission) && (
            <>
              <button
                type="button"
                className="rounded-lg border border-[var(--nodra-border)] px-3 py-2 text-[13px] font-medium"
                onClick={() => void onLink()}
                disabled={busy}
              >
                Change folder
              </button>
              {needsPermission && (
                <button
                  type="button"
                  className="nodra-new-page-btn rounded-lg px-3 py-2 text-[13px] font-medium"
                  onClick={() => void onReauthorize()}
                  disabled={busy}
                >
                  Allow access
                </button>
              )}
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-[13px] text-[var(--nodra-muted)] hover:text-[var(--nodra-fg)]"
                onClick={() => void onUnlink()}
                disabled={busy}
              >
                Unlink
              </button>
            </>
          )}
        </div>
      )}

      {supported && needsPermission && (
        <p className="mt-2 text-xs text-[var(--nodra-muted)]">
          Access was revoked or expired. Click &quot;Allow access&quot; or choose
          the folder again.
        </p>
      )}
    </section>
  );
}
