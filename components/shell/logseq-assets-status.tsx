"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useLogseqAssetLink } from "@/components/logseq/use-logseq-asset-link";
import {
  LOGSEQ_ASSETS_FOLDER_EVENT,
  logseqAssetsTopBarLabel,
  logseqAssetsTopBarTitle,
} from "@/lib/logseq/local-asset-folder";
import { useActiveGraph } from "@/components/shell/active-graph-context";

type Props = {
  graphId: string;
};

const statusClass =
  "nodra-assets-status flex min-w-0 max-w-[11rem] items-center gap-1.5 text-xs sm:max-w-[16rem] md:max-w-[22rem] lg:max-w-[28rem]";

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

  const title = `${logseqAssetsTopBarTitle(status, meta)}${error ? `\n\n${error}` : ""}`;

  if (supported === false) {
    return (
      <Link
        href="/settings#logseq-assets"
        className={`${statusClass} text-[var(--nodra-muted)]`}
        title="Assets linking is not available in this browser"
      >
        <FolderOpen size={14} className="shrink-0" aria-hidden />
        <span className="truncate">Assets unavailable</span>
      </Link>
    );
  }

  const label = busy ? "Linking…" : logseqAssetsTopBarLabel(status, meta);
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
        className={`${statusClass} ${tone}`}
        title={title}
        disabled={busy || supported === null}
        onClick={() => void onActivate()}
      >
        <FolderOpen size={14} className="shrink-0" aria-hidden />
        <span className="truncate font-medium">{label}</span>
      </button>
    );
  }

  return (
    <Link
      href="/settings#logseq-assets"
      className={`${statusClass} ${tone}`}
      title={title}
    >
      <FolderOpen size={14} className="shrink-0" aria-hidden />
      <span className="truncate">
        {status === "ready" ? (
          <>
            <span className="font-medium text-[var(--nodra-fg)]">
              Assets linked
            </span>
            <span className="hidden text-[var(--nodra-muted)] sm:inline">
              {" · "}
              {logseqAssetsTopBarLabel(status, meta)}
            </span>
          </>
        ) : (
          label
        )}
      </span>
    </Link>
  );
}
