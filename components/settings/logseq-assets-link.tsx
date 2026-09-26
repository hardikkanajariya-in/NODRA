"use client";

import { useEffect, useMemo, useState } from "react";
import { typicalLogseqAssetsPathHints } from "@/lib/logseq/assets-path-hints";
import {
  isBraveBrowser,
  isLogseqAssetPickerSupported,
  linkedAssetsPathLabel,
  readLogseqAssetsMeta,
  unlinkLogseqAssetsFolder,
  updateLogseqAssetsDisplayPath,
} from "@/lib/logseq/local-asset-folder";
import { useLogseqAssetLink } from "@/components/logseq/use-logseq-asset-link";

type Props = {
  graphId: string;
  graphName: string;
};

export function LogseqAssetsLink({ graphId, graphName }: Props) {
  const {
    status,
    meta,
    supported,
    busy,
    error,
    setError,
    refresh,
    linkFolder,
    reauthorize,
  } = useLogseqAssetLink(graphId, graphName);

  const [pathDraft, setPathDraft] = useState("");
  const [braveNeedsFlag, setBraveNeedsFlag] = useState(false);

  const pathHints = useMemo(
    () => typicalLogseqAssetsPathHints(graphName),
    [graphName],
  );

  useEffect(() => {
    if (!graphId) return;
    void (async () => {
      setPathDraft(linkedAssetsPathLabel(readLogseqAssetsMeta(graphId)) ?? "");
      if (!isLogseqAssetPickerSupported() && (await isBraveBrowser())) {
        setBraveNeedsFlag(true);
      }
    })();
  }, [graphId, status, meta]);

  async function onUnlink() {
    if (!graphId) return;
    setError("");
    try {
      await unlinkLogseqAssetsFolder(graphId);
      await refresh();
      setPathDraft("");
    } catch {
      setError("Could not unlink folder.");
    }
  }

  function saveDisplayPath() {
    if (!graphId) return;
    updateLogseqAssetsDisplayPath(graphId, pathDraft);
    void refresh();
  }

  const pickerSupported = supported === true;
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
      id="logseq-assets"
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

      {supported === null && (
        <p className="mt-3 text-xs text-[var(--nodra-muted)]">
          Checking browser support…
        </p>
      )}

      {supported === false && braveNeedsFlag && (
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
      {supported === false && !braveNeedsFlag && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Folder linking needs a browser that exposes{" "}
          <code className="text-[12px]">showDirectoryPicker</code> (Chrome,
          Edge, or Brave with the File System Access flag) over HTTPS.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-[var(--nodra-danger)]" role="alert">
          {error}
        </p>
      )}

      {pickerSupported && connectedPath && (linked || needsPermission) && (
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
            className="nodra-dialog-btn nodra-dialog-btn--ghost mt-2 px-2 py-1 text-xs"
            onClick={saveDisplayPath}
            disabled={!pathDraft.trim()}
          >
            Save path label
          </button>
        </div>
      )}

      {pickerSupported && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!linked && !needsPermission && (
            <button
              type="button"
              className="nodra-new-page-btn rounded-lg px-3 py-2 text-[13px] font-medium"
              onClick={() => void linkFolder()}
              disabled={busy}
            >
              {busy ? "Opening picker…" : "Link assets folder"}
            </button>
          )}
          {(linked || needsPermission) && (
            <>
              <button
                type="button"
                className="nodra-dialog-btn nodra-dialog-btn--ghost px-3 py-2 text-[13px] font-medium"
                onClick={() => void linkFolder()}
                disabled={busy}
              >
                Change folder
              </button>
              {needsPermission && (
                <button
                  type="button"
                  className="nodra-new-page-btn rounded-lg px-3 py-2 text-[13px] font-medium"
                  onClick={() => void reauthorize()}
                  disabled={busy}
                >
                  Allow access
                </button>
              )}
              <button
                type="button"
                className="nodra-dialog-btn nodra-dialog-btn--ghost px-3 py-2 text-[13px] text-[var(--nodra-muted)]"
                onClick={() => void onUnlink()}
                disabled={busy}
              >
                Unlink
              </button>
            </>
          )}
        </div>
      )}

      {pickerSupported && needsPermission && (
        <p className="mt-2 text-xs text-[var(--nodra-muted)]">
          Access was revoked or expired. Click &quot;Allow access&quot; or choose
          the folder again.
        </p>
      )}
    </section>
  );
}
