"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureLogseqAssetPermission,
  getLogseqAssetFolderStatus,
  isLogseqAssetPickerSupported,
  linkLogseqAssetsFolder,
  readLogseqAssetsMeta,
  type LogseqAssetFolderStatus,
  type LogseqAssetsFolderMeta,
} from "@/lib/logseq/local-asset-folder";

function linkErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "AbortError") {
      return "";
    }
    if (error.name === "NotAllowedError") {
      return "Folder access was blocked. Allow the prompt or check browser permissions.";
    }
    if (error.name === "SecurityError") {
      return "Folder linking requires a secure (HTTPS) connection.";
    }
    return error.message || "Could not open the folder picker.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Could not link the assets folder.";
}

export function useLogseqAssetLink(graphId: string, graphName: string) {
  const [status, setStatus] = useState<LogseqAssetFolderStatus>("not_linked");
  const [meta, setMeta] = useState<LogseqAssetsFolderMeta | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!graphId) {
      setStatus("not_linked");
      setMeta(null);
      return;
    }
    const nextSupported = isLogseqAssetPickerSupported();
    const nextMeta = readLogseqAssetsMeta(graphId);
    const nextStatus = await getLogseqAssetFolderStatus(graphId);
    setSupported(nextSupported);
    setMeta(nextMeta);
    setStatus(nextStatus);
  }, [graphId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!graphId) {
        if (!cancelled) {
          setStatus("not_linked");
          setMeta(null);
        }
        return;
      }
      const nextSupported = isLogseqAssetPickerSupported();
      const nextMeta = readLogseqAssetsMeta(graphId);
      const nextStatus = await getLogseqAssetFolderStatus(graphId);
      if (cancelled) return;
      setSupported(nextSupported);
      setMeta(nextMeta);
      setStatus(nextStatus);
    })();
    return () => {
      cancelled = true;
    };
  }, [graphId]);

  const linkFolder = useCallback(async () => {
    if (!graphId) return;
    setError("");
    if (!isLogseqAssetPickerSupported()) {
      setError(
        "This browser does not support folder linking. Use Chrome, Edge, or Brave with the File System Access API enabled.",
      );
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Folder linking requires HTTPS.");
      return;
    }
    setBusy(true);
    try {
      const next = await linkLogseqAssetsFolder(graphId, graphName);
      setStatus(next);
      setMeta(readLogseqAssetsMeta(graphId));
      if (next === "denied") {
        setError("Folder chosen, but read access was not granted.");
      }
    } catch (err) {
      const message = linkErrorMessage(err);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  }, [graphId, graphName]);

  const reauthorize = useCallback(async () => {
    if (!graphId) return;
    setError("");
    setBusy(true);
    try {
      const next = await ensureLogseqAssetPermission(graphId);
      setStatus(next);
      if (next === "denied") {
        setError("Access was not granted. Try linking the folder again.");
      }
    } catch (err) {
      const message = linkErrorMessage(err);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  }, [graphId]);

  return {
    status,
    meta,
    supported,
    busy,
    error,
    setError,
    refresh,
    linkFolder,
    reauthorize,
  };
}
