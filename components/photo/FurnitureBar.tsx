"use client";

import { PRODUCTS_BY_ID } from "@/data/products";
import type { FurnitureItem } from "@/hooks/usePhotoDesign";
import { WALL_ITEM_SLOTS, autoWallAngle } from "@/lib/config";

interface Props {
  item: FurnitureItem;
  onUpdate: (patch: Partial<FurnitureItem>) => void;
  onRemove: () => void;
}

/** Controls for the selected piece of furniture. */
export default function FurnitureBar({ item, onUpdate, onRemove }: Props) {
  const product = PRODUCTS_BY_ID[item.productId];
  const rotation = item.rotation ?? 0;
  const isWallItem = !!product && WALL_ITEM_SLOTS.includes(product.slot);
  const angle = item.angle ?? autoWallAngle(item.x);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
      <span className="text-sm font-medium text-navy">{product?.name ?? "Item"}</span>

      <label className="flex items-center gap-2 text-xs text-ink/70">
        Size
        <input
          type="range" min={0.1} max={0.8} step={0.01} value={item.scale}
          onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
          aria-label="Size" className="w-24"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-ink/70">
        Rotate
        <input
          type="range" min={-45} max={45} step={1} value={rotation}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          aria-label="Rotation" className="w-24"
        />
        <span className="w-8 text-right font-mono">{rotation}°</span>
      </label>

      {isWallItem && (
        <label className="flex items-center gap-2 text-xs text-ink/70">
          Wall angle
          <input
            type="range" min={-60} max={60} step={1} value={angle}
            onChange={(e) => onUpdate({ angle: Number(e.target.value) })}
            aria-label="Wall angle" className="w-24"
          />
          <span className="w-10 text-right font-mono">{item.angle === undefined ? "auto" : `${angle}°`}</span>
          {item.angle !== undefined && (
            <button
              onClick={() => onUpdate({ angle: undefined })}
              className="rounded-full border border-navy/30 px-2 py-1 text-[11px] font-semibold text-navy hover:bg-cream"
            >
              Auto
            </button>
          )}
        </label>
      )}

      <button
        onClick={() => onUpdate({ flipped: !item.flipped })}
        className="rounded-full border border-navy/30 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-cream"
      >
        Flip
      </button>

      <button
        onClick={onRemove}
        className="ml-auto rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
      >
        Remove
      </button>
    </div>
  );
}