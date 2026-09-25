"use client";

import { useCallback, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Trash2,
} from "lucide-react";

type Align = "left" | "center" | "right";

export function AssetImageView({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
}: NodeViewProps) {
  const align = (node.attrs.align as Align) || "left";
  const width = node.attrs.width as number | null;
  const caption = node.attrs.caption as string | null;
  const src = node.attrs.src as string;
  const [menuOpen, setMenuOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

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
      className={`nodra-asset-image nodra-asset-image--${align}`}
      data-drag-handle
    >
      {(selected || menuOpen) && (
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
        onClick={() => setMenuOpen(true)}
        onBlur={() => {
          if (!selected) setMenuOpen(false);
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
