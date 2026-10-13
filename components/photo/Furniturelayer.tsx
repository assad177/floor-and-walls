"use client";

import { useRef } from "react";
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

const MIN_SCALE = 0.05;
const MAX_SCALE = 0.9;
const MAX_ROTATION = 45;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** Keeps an item inside the photo sideways, allowing for its own width. */
const clampX = (x: number, scale: number) => (scale >= 1 ? 0.5 : clamp(x, scale / 2, 1 - scale / 2));
/** Share of the item's width its floor shadow covers. Move this into product data when convenient. */
const shadowSpan = (p: Product) => (p.id.includes("plant") ? 0.3 : 0.88);

type Drag =
  | { kind: "move"; id: string; px: number; py: number; ox: number; oy: number }
  | { kind: "resize"; id: string; cx: number; cy: number; startDist: number; oscale: number }
  | { kind: "rotate"; id: string; cx: number; cy: number; startAngle: number; orotation: number };

/** Centre of the item's frame on screen. */
function frameCentre(el: HTMLElement) {
  const r = (el.closest("[data-frame]") as HTMLElement).getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

/** Placed items over the photo. Items lower on the photo are drawn in front. */
export default function FurnitureLayer({ items, selectedId, onSelect, onUpdate }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const handleMove = (e: React.PointerEvent, item: FurnitureItem) => {
    const d = drag.current;
    if (!d || d.id !== item.id) return;

    if (d.kind === "move") {
      const r = layerRef.current!.getBoundingClientRect();
      onUpdate(item.id, {
        x: clampX(d.ox + (e.clientX - d.px) / r.width, item.scale),
        y: clamp(d.oy + (e.clientY - d.py) / r.height, 0, 1),
      });
    } else if (d.kind === "resize") {
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      const scale = clamp((d.oscale * dist) / Math.max(d.startDist, 1), MIN_SCALE, MAX_SCALE);
      onUpdate(item.id, { scale, x: clampX(item.x, scale) });
    } else {
      const a = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI;
      let r = d.orotation + (a - d.startAngle);
      r = ((((r + 180) % 360) + 360) % 360) - 180; // keep within -180..180
      r = clamp(Math.round(r), -MAX_ROTATION, MAX_ROTATION);
      onUpdate(item.id, { rotation: Math.abs(r) < 3 ? 0 : r }); // snaps to straight
    }
  };

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0">
      {items.map((item) => {
        const product = PRODUCTS_BY_ID[item.productId];
        if (!product) return null;

        const src = PRODUCT_IMAGES[item.productId] ?? product.image;
        const selected = item.id === selectedId;
        const rotation = item.rotation ?? 0;
        const isWallItem = WALL_ITEM_SLOTS.includes(product.slot);
        const angle = isWallItem ? (item.angle ?? autoWallAngle(item.x)) : 0;
        const span = shadowSpan(product);
        const flip = item.flipped ? "scaleX(-1)" : undefined;

        return (
          <div
            key={item.id}
            className="pointer-events-auto absolute select-none"
            style={{
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              width: `${item.scale * 100}%`,
              transform: isWallItem ? "translate(-50%, -50%)" : "translate(-50%, -100%)",
              zIndex: selected ? 1000 : 10 + Math.round(item.y * 100),
              cursor: "move",
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              onSelect(item.id);
              drag.current = { kind: "move", id: item.id, px: e.clientX, py: e.clientY, ox: item.x, oy: item.y };
            }}
            onPointerMove={(e) => handleMove(e, item)}
            onPointerUp={(e) => {
              drag.current = null;
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            {/* everything that turns (angle, rotation, handles) lives in this frame */}
            <div
              data-frame
              className="relative"
              style={{ transform: `perspective(900px) rotateY(${angle}deg) rotate(${rotation}deg)` }}
            >
              {/* floor items get a contact shadow; wall items get a soft drop-shadow instead */}
              {!isWallItem && (
                <div
                  aria-hidden
                  className="absolute -bottom-[3%] h-[10%] rounded-[50%] bg-black/35 blur-md"
                  style={{ left: `${((1 - span) / 2) * 100}%`, width: `${span * 100}%` }}
                />
              )}

              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={product.name}
                  draggable={false}
                  className="relative block w-full"
                  style={{
                    transform: flip,
                    filter: isWallItem ? "drop-shadow(0 6px 8px rgba(0,0,0,0.35))" : undefined,
                  }}
                />
              ) : (
                <div
                  className="relative flex aspect-[2/1] w-full items-center justify-center rounded-md p-1 text-center text-[10px] font-medium text-white"
                  style={{ backgroundColor: product.color, transform: flip }}
                >
                  {product.name}
                </div>
              )}

              {selected && (
                <>
                  <div aria-hidden className="pointer-events-none absolute inset-0 border-2 border-blue-500" />

                  {/* corner handles: resize from the item's centre */}
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
                          kind: "resize", id: item.id, cx, cy,
                          startDist: Math.hypot(e.clientX - cx, e.clientY - cy), oscale: item.scale,
                        };
                      }}
                    />
                  ))}

                  {/* rotate handle above the item */}
                  <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 flex-col items-center">
                    <div
                      className="h-5 w-5 cursor-grab rounded-full border-2 border-white bg-blue-500 shadow-md"
                      style={{ touchAction: "none" }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const { cx, cy } = frameCentre(e.currentTarget);
                        drag.current = {
                          kind: "rotate", id: item.id, cx, cy,
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