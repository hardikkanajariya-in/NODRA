"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Trash2,
} from "lucide-react";
import {
  readUploadProgress,
  subscribeUploadProgress,
} from "@/lib/assets/upload-progress";

type Align = "left" | "center" | "right";

export function AssetImageView({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const align = (node.attrs.align as Align) || "left";
  const width = node.attrs.width as number | null;
  const caption = node.attrs.caption as string | null;
  const src = node.attrs.src as string;
  const uploading = Boolean(node.attrs.uploading);
  const uploadFailed = Boolean(node.attrs.uploadFailed);
  const uploadId = (node.attrs.uploadId as string | null) ?? null;
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) {
      setMenuOpen(false);
      setAlignOpen(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as globalThis.Node)) {
        setMenuOpen(false);
        setAlignOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAlignOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!uploading || !uploadId) return;
    setProgress(readUploadProgress(uploadId));
    return subscribeUploadProgress(uploadId, (percent) => {
      setProgress((prev) => Math.max(prev, percent));
    });
  }, [uploading, uploadId]);

  const setAlign = useCallback(
    (value: Align) => {
      updateAttributes({ align: value });
      setAlignOpen(false);
      setMenuOpen(false);
    },
    [updateAttributes],
  );

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(src);
    } catch {
      // ignore
    }
    setMenuOpen(false);
  }, [src]);

  const onResizeStart = useCallback(
    (clientX: number, side: "left" | "right") => {
      const img = document.querySelector(
        `[data-asset-id="${node.attrs.assetId}"]`,
      ) as HTMLImageElement | null;
      const w = img?.getBoundingClientRect().width ?? 320;
      resizing.current = true;
      startX.current = clientX;
      startWidth.current = w;
      (resizing as { side?: "left" | "right" }).side = side;
    },
    [node.attrs.assetId],
  );

  const onResizeMove = useCallback(
    (clientX: number) => {
      if (!resizing.current) return;
      const delta = clientX - startX.current;
      const side = (resizing as { side?: "left" | "right" }).side ?? "right";
      const signed = side === "left" ? -delta : delta;
      const next = Math.max(120, Math.min(900, startWidth.current + signed));
      updateAttributes({ width: Math.round(next) });
    },
    [updateAttributes],
  );

  const onResizeEnd = useCallback(() => {
    resizing.current = false;
  }, []);

  return (
    <NodeViewWrapper
      ref={rootRef}
      className={`nodra-asset-image nodra-asset-image--${align}${
        selected ? " nodra-asset-image--selected" : ""
      }`}
      data-drag-handle
    >
      {menuOpen && (
        <div className="nodra-asset-image-toolbar">
          <div className="nodra-asset-image-menu">
            <button
              type="button"
              className="nodra-asset-image-menu-btn"
              onClick={() => setAlignOpen((v) => !v)}
            >
              Align ›
            </button>
            {alignOpen && (
              <div className="nodra-asset-image-submenu">
                <button type="button" onClick={() => setAlign("left")}>
                  <AlignLeft size={14} />
                  Align left {align === "left" ? "✓" : ""}
                </button>
                <button type="button" onClick={() => setAlign("center")}>
                  <AlignCenter size={14} />
                  Align center {align === "center" ? "✓" : ""}
                </button>
                <button type="button" onClick={() => setAlign("right")}>
                  <AlignRight size={14} />
                  Align right {align === "right" ? "✓" : ""}
                </button>
              </div>
            )}
            <button type="button" onClick={() => void onCopy()}>
              <Copy size={14} />
              Copy image URL
            </button>
            <button
              type="button"
              className="nodra-asset-image-danger"
              onClick={() => {
                deleteNode();
                setMenuOpen(false);
              }}
            >
              <Trash2 size={14} />
              Delete image
            </button>
          </div>
        </div>
      )}

      <div
        className="nodra-asset-image-frame"
        style={width ? { width: `${width}px` } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((open) => !open);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={(node.attrs.alt as string) || ""}
          data-asset-id={node.attrs.assetId as string}
          draggable={false}
          style={width ? { width: "100%" } : undefined}
        />
        {uploading && (
          <div className="nodra-asset-upload" aria-live="polite">
            <div
              className="nodra-asset-upload-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Uploading image"
            >
              <div
                className="nodra-asset-upload-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="nodra-asset-upload-label">
              {progress >= 96 && progress < 100
                ? "Processing…"
                : `Uploading · ${progress}%`}
            </span>
          </div>
        )}
        {uploadFailed && (
          <div className="nodra-asset-upload-label">Upload failed</div>
        )}
        <span
          className="nodra-asset-image-handle nodra-asset-image-handle--left"
          onMouseDown={(e) => {
            e.preventDefault();
            onResizeStart(e.clientX, "left");
            const move = (ev: MouseEvent) => onResizeMove(ev.clientX);
            const up = () => {
              onResizeEnd();
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
        />
        <span
          className="nodra-asset-image-handle nodra-asset-image-handle--right"
          onMouseDown={(e) => {
            e.preventDefault();
            onResizeStart(e.clientX, "right");
            const move = (ev: MouseEvent) => onResizeMove(ev.clientX);
            const up = () => {
              onResizeEnd();
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
        />
      </div>

      {caption && (
        <p className="nodra-asset-image-caption">{caption}</p>
      )}

    </NodeViewWrapper>
  );
}
