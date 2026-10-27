"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCT_IMAGES } from "@/data/productImages";
import { PRODUCTS_BY_ID } from "@/data/products";
import type { FurnitureItem } from "@/hooks/usePhotoDesign";
import { WALL_ITEM_SLOTS, autoWallAngle } from "@/lib/config";
import type { Product } from "@/lib/types";

interface Props {
  items: FurnitureItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<FurnitureItem>) => void;
}

const MIN_SCALE = 0.04;
const MAX_SCALE = 0.85;
const MAX_ROTATION = 45;
const DEFAULT_SCALE = 0.22;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const clampX = (x: number, width: number) => (width >= 1 ? 0.5 : clamp(x, width / 2, 1 - width / 2));
const shadowSpan = (p: Product) => (p.id.includes("plant") ? 0.3 : 0.85);

const bottomTrimCache = new Map<string, number>();

function useImageBottomTrim(srcs: (string | undefined)[]) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    srcs.forEach((src) => {
      if (!src || bottomTrimCache.has(src)) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const w = Math.min(img.naturalWidth || 128, 128);
          const h = Math.min(img.naturalHeight || 128, 128);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;

          let lastOpaqueRow = h - 1;
          outer: for (let y = h - 1; y >= 0; y--) {
            for (let x = 0; x < w; x++) {
              const alpha = data[(y * w + x) * 4 + 3];
              if (alpha > 25) {
                lastOpaqueRow = y;
                break outer;
              }
            }
          }

          const emptyBottomRatio = clamp((h - 1 - lastOpaqueRow) / h, 0, 0.42);
          bottomTrimCache.set(src, emptyBottomRatio);
          forceRender((n) => n + 1);
        } catch {
          bottomTrimCache.set(src, 0);
        }
      };
      img.src = src;
    });
  }, [srcs]);
}

type Drag =
  | { kind: "move"; id: string; px: number; py: number; ox: number; oy: number }
  | {
      kind: "resize";
      id: string;
      cx: number;
      cy: number;
      startDist: number;
      oscale: number;
      oscaleY?: number;
    }
  | { kind: "rotate"; id: string; cx: number; cy: number; startAngle: number; orotation: number };

function frameCentre(el: HTMLElement) {
  const r = (el.closest("[data-frame]") as HTMLElement).getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

export default function FurnitureLayer({ items, selectedId, onSelect, onUpdate }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  useImageBottomTrim(
    items.map((item) => PRODUCT_IMAGES[item.productId] ?? PRODUCTS_BY_ID[item.productId]?.image)
  );

  const handleMove = (e: React.PointerEvent, item: FurnitureItem) => {
    const d = drag.current;
    if (!d || d.id !== item.id || !layerRef.current) return;

    if (d.kind === "move") {
      const r = layerRef.current.getBoundingClientRect();
      const width = clamp(item.scale ?? DEFAULT_SCALE, MIN_SCALE, MAX_SCALE);

      onUpdate(item.id, {
        x: clampX(d.ox + (e.clientX - d.px) / r.width, width),
        y: clamp(d.oy + (e.clientY - d.py) / r.height, 0.02, 0.96),
      });
    } else if (d.kind === "resize") {
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      const ratio = dist / Math.max(d.startDist, 1);
      const scale = clamp(d.oscale * ratio, MIN_SCALE, MAX_SCALE);

      // Agar item ke paas dynamic height (scaleY) hai, toh resize karte waqt usay bhi proportionally scale karein
      const nextPatch: Partial<FurnitureItem> = {
        scale,
        x: clampX(item.x, scale),
      };
      if (d.oscaleY != null) {
        nextPatch.scaleY = clamp(d.oscaleY * ratio, MIN_SCALE, 0.95);
      }

      onUpdate(item.id, nextPatch);
    } else {
      const a = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI;
      let r = d.orotation + (a - d.startAngle);
      r = ((((r + 180) % 360) + 360) % 360) - 180;
      r = clamp(Math.round(r), -MAX_ROTATION, MAX_ROTATION);
      onUpdate(item.id, { rotation: Math.abs(r) < 3 ? 0 : r });
    }
  };

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item) => {
        const product = PRODUCTS_BY_ID[item.productId];
        if (!product) return null;

        const src = PRODUCT_IMAGES[item.productId] ?? product.image;
        const selected = item.id === selectedId;
        const rotation = item.rotation ?? 0;
        const isCurtain = product.slot === "curtain";
        const isWallItem = WALL_ITEM_SLOTS.includes(product.slot);

        const angle = item.angle ?? (isWallItem && !isCurtain ? autoWallAngle(item.x) : 0);
        const span = shadowSpan(product);
        const scale = clamp(item.scale ?? DEFAULT_SCALE, MIN_SCALE, MAX_SCALE);
        const computedWidthPercent = scale * 100;

        // EXACT WINDOW LENGTH: Backend se aane wali window height (`scaleY`) ko direct % height mein convert karein
        const hasExactHeight = isCurtain && typeof item.scaleY === "number" && item.scaleY > 0;
        const computedHeightPercent = hasExactHeight
          ? clamp(item.scaleY!, 0.05, 0.95) * 100
          : undefined;

        const zIndex = selected
          ? 1000
          : isWallItem
            ? 10
            : isCurtain
              ? 15
              : 20 + Math.round(item.y * 100);

        const bottomTrim = src ? (bottomTrimCache.get(src) ?? 0.04) : 0;
        const anchorYPercent = Math.round((1 - bottomTrim) * 100);
        const shadowBottomPercent = Math.round(bottomTrim * 100 + 2);

        // Curtain top-center (rod mount) se hang karega, baqi items apne anchor se
        const transform = isCurtain
          ? "translate(-50%, 0%)"
          : isWallItem
            ? "translate(-50%, -50%)"
            : `translate(-50%, -${anchorYPercent}%)`;

        return (
          <div
            key={item.id}
            className="pointer-events-auto absolute select-none"
            style={{
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              width: `${computedWidthPercent}%`,
              height: computedHeightPercent ? `${computedHeightPercent}%` : undefined,
              transform,
              zIndex,
              cursor: "move",
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              onSelect(item.id);
              drag.current = {
                kind: "move",
                id: item.id,
                px: e.clientX,
                py: e.clientY,
                ox: item.x,
                oy: item.y,
              };
            }}
            onPointerMove={(e) => handleMove(e, item)}
            onPointerUp={(e) => {
              drag.current = null;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
            }}
          >
            <div
              data-frame
              className={`relative w-full ${computedHeightPercent ? "h-full" : ""}`}
              style={{
                transform: `perspective(900px) rotateY(${angle}deg) rotate(${rotation}deg)`,
                transformOrigin: isCurtain ? "top center" : "center center",
              }}
            >
              {!isWallItem && !isCurtain && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 -z-10 h-[7%] -translate-x-1/2 rounded-[50%] bg-black/50 blur-md"
                  style={{
                    width: `${span * 90}%`,
                    bottom: `${shadowBottomPercent}%`,
                  }}
                />
              )}

              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={product.name}
                  draggable={false}
                  className={
                    computedHeightPercent
                      ? "relative block h-full w-full object-fill"
                      : "relative block h-auto w-full object-contain"
                  }
                  style={{
                    transform: item.flipped ? "scaleX(-1)" : undefined,
                    filter: isWallItem
                      ? "drop-shadow(0 6px 10px rgba(0,0,0,0.35))"
                      : "drop-shadow(0 4px 6px rgba(0,0,0,0.28))",
                  }}
                />
              ) : (
                <div
                  className="relative flex aspect-[2/1] w-full items-center justify-center rounded-md border border-white/25 p-1 text-center text-[10px] font-medium text-white shadow-md backdrop-blur-sm"
                  style={{
                    backgroundColor: `${product.color}CC`,
                    transform: item.flipped ? "scaleX(-1)" : undefined,
                  }}
                >
                  {product.name}
                </div>
              )}

              {selected && (
                <>
                  <div aria-hidden className="pointer-events-none absolute inset-0 border-2 border-blue-500" />

                  {["-left-2.5 -top-2.5", "-right-2.5 -top-2.5", "-bottom-2.5 -left-2.5", "-bottom-2.5 -right-2.5"].map((pos) => (
                    <div
                      key={pos}
                      className={`absolute ${pos} h-5 w-5 rounded-full border-2 border-blue-500 bg-white shadow-md`}
                      style={{ cursor: "nwse-resize", touchAction: "none" }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const { cx, cy } = frameCentre(e.currentTarget);
                        drag.current = {
                          kind: "resize",
                          id: item.id,
                          cx,
                          cy,
                          startDist: Math.hypot(e.clientX - cx, e.clientY - cy),
                          oscale: item.scale ?? DEFAULT_SCALE,
                          oscaleY: item.scaleY,
                        };
                      }}
                    />
                  ))}

                  <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 flex-col items-center">
                    <div
                      className="h-5 w-5 cursor-grab rounded-full border-2 border-white bg-blue-500 shadow-md"
                      style={{ touchAction: "none" }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const { cx, cy } = frameCentre(e.currentTarget);
                        drag.current = {
                          kind: "rotate",
                          id: item.id,
                          cx,
                          cy,
                          startAngle: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
                          orotation: rotation,
                        };
                      }}
                    />
                    <div className="h-5 w-px bg-blue-500" />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}