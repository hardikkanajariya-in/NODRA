"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  LOGSEQ_ASSETS_FOLDER_EVENT,
  getLogseqAssetFolderStatus,
  isLogseqAssetPickerSupported,
  logseqAssetsStatusLabel,
  readLogseqAssetsMeta,
  type LogseqAssetFolderStatus,
  type LogseqAssetsFolderMeta,
} from "@/lib/logseq/local-asset-folder";

type Props = {
  graphId: string;
};

export function LogseqAssetsTopBarStatus({ graphId }: Props) {
  const [status, setStatus] = useState<LogseqAssetFolderStatus>("not_linked");
  const [meta, setMeta] = useState<LogseqAssetsFolderMeta | null>(null);
  const [supported, setSupported] = useState(false);

  const refresh = useCallback(async () => {
    if (!graphId) {
      setStatus("not_linked");
      setMeta(null);
      return;
    }
    setSupported(isLogseqAssetPickerSupported());
    setMeta(readLogseqAssetsMeta(graphId));
    setStatus(await getLogseqAssetFolderStatus(graphId));
  }, [graphId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ graphId: string }>).detail;
      if (detail?.graphId === graphId) void refresh();
    };
    window.addEventListener(LOGSEQ_ASSETS_FOLDER_EVENT, onChanged);
    return () =>
      window.removeEventListener(LOGSEQ_ASSETS_FOLDER_EVENT, onChanged);
  }, [graphId, refresh]);

  if (!graphId || !supported) return null;

  const label = logseqAssetsStatusLabel(status, meta);
  const tone =
    status === "ready"
      ? "text-[var(--nodra-muted)]"
      : status === "denied"
        ? "text-amber-600 dark:text-amber-400"
        : "text-[var(--nodra-muted)]";

  return (
    <Link
      href="/settings"
      className={`nodra-assets-status flex max-w-[8rem] items-center gap-1 truncate text-xs md:max-w-[10rem] ${tone}`}
      title={`${label} — per graph, stored on this device only. Open Settings to link or change.`}
    >
      <FolderOpen size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
