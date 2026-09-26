"use client";

import { useEffect, useState } from "react";
import {
  ensureLogseqAssetPermission,
  getLogseqAssetFolderStatus,
  isBraveBrowser,
  isLogseqAssetPickerSupported,
  linkLogseqAssetsFolder,
  readLogseqAssetsMeta,
  unlinkLogseqAssetsFolder,
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
  const [busy, setBusy] = useState(false);
  const [braveNeedsFlag, setBraveNeedsFlag] = useState(false);
  /** null until mounted — avoids SSR/client mismatch for window APIs */
  const [pickerSupported, setPickerSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (!graphId) return;
    void (async () => {
      const supported = isLogseqAssetPickerSupported();
      setPickerSupported(supported);
      setMeta(readLogseqAssetsMeta(graphId));
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
      const next = await linkLogseqAssetsFolder(graphId);
      setStatus(next);
      setMeta(readLogseqAssetsMeta(graphId));
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
    } finally {
      setBusy(false);
    }
  }

  const supported = pickerSupported === true;
  const linked = status === "ready";
  const needsPermission = status === "denied";

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
      <p className="mt-2 text-xs text-[var(--nodra-muted)]">
        Typical path:{" "}
        <code className="text-[11px]">
          %USERPROFILE%\logseq\graphs\&lt;graph&gt;\assets
        </code>
      </p>

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
          <p className="mt-2 text-xs text-[var(--nodra-muted)]">
            Until then, use Chrome or Edge for folder linking, or paste images
            that include file data in the clipboard.
          </p>
        </div>
      )}
      {pickerSupported === false && !braveNeedsFlag && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Folder linking needs a browser that exposes{" "}
          <code className="text-[12px]">showDirectoryPicker</code> (Chrome,
          Edge, or Brave with the File System Access flag). Text paste still
          works elsewhere.
        </p>
      )}

      {supported && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {linked && meta && (
            <span className="text-sm text-[var(--nodra-muted)]">
              Linked on this device:{" "}
              <span className="font-medium text-[var(--nodra-fg)]">
                {meta.name}
              </span>
            </span>
          )}
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
