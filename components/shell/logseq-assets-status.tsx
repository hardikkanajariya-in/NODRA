"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useLogseqAssetLink } from "@/components/logseq/use-logseq-asset-link";
import {
  LOGSEQ_ASSETS_FOLDER_EVENT,
  logseqAssetsStatusLabel,
  logseqAssetsStatusTitle,
} from "@/lib/logseq/local-asset-folder";
import { useActiveGraph } from "@/components/shell/active-graph-context";

type Props = {
  graphId: string;
};

export function LogseqAssetsTopBarStatus({ graphId }: Props) {
  const { name: graphName } = useActiveGraph();
  const {
    status,
    meta,
    supported,
    busy,
    error,
    linkFolder,
    reauthorize,
    refresh,
  } = useLogseqAssetLink(graphId, graphName);

  useEffect(() => {
    if (!graphId) return;
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ graphId: string }>).detail;
      if (detail?.graphId === graphId) void refresh();
    };
    window.addEventListener(LOGSEQ_ASSETS_FOLDER_EVENT, onChanged);
    return () =>
      window.removeEventListener(LOGSEQ_ASSETS_FOLDER_EVENT, onChanged);
  }, [graphId, refresh]);

  const onActivate = useCallback(async () => {
    if (status === "not_linked") {
      await linkFolder();
      return;
    }
    if (status === "denied") {
      await reauthorize();
    }
  }, [linkFolder, reauthorize, status]);

  if (!graphId) return null;

  if (supported === false) {
    return (
      <Link
        href="/settings#logseq-assets"
        className="nodra-assets-status flex max-w-[8rem] items-center gap-1 truncate text-xs text-[var(--nodra-muted)] md:max-w-[14rem]"
        title="Assets linking is not available in this browser"
      >
        <FolderOpen size={14} className="shrink-0" aria-hidden />
        <span className="truncate">Assets unavailable</span>
      </Link>
    );
  }

  const label = logseqAssetsStatusLabel(status, meta);
  const title = logseqAssetsStatusTitle(status, meta);
  const tone =
    status === "ready"
      ? "text-[var(--nodra-muted)]"
      : status === "denied"
        ? "text-amber-600 dark:text-amber-400"
        : "text-[var(--nodra-link)]";

  const interactive = status === "not_linked" || status === "denied";

  if (interactive) {
    return (
      <button
        type="button"
        className={`nodra-assets-status flex max-w-[6rem] items-center gap-1 truncate text-xs md:max-w-[12rem] ${tone}`}
        title={`${title}${error ? `\n${error}` : ""}`}
        disabled={busy || supported === null}
        onClick={() => void onActivate()}
      >
        <FolderOpen size={14} className="shrink-0" aria-hidden />
        <span className="truncate">
          {busy ? "Linking…" : label}
        </span>
      </button>
    );
  }

  return (
    <Link
      href="/settings#logseq-assets"
      className={`nodra-assets-status flex max-w-[6rem] items-center gap-1 truncate text-xs md:max-w-[12rem] ${tone}`}
      title={title}
    >
      <FolderOpen size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
