"use client";

import { PRODUCTS } from "@/data/products";
import { PRODUCT_IMAGES } from "@/data/productImages";
import { TEXTURES } from "@/data/textures";
import { SLOTS } from "@/lib/config";
import { money } from "@/lib/pricing";
import type { Design, Product, Slot } from "@/lib/types";

interface Props {
  design: Design;
  onSelect: (slot: Slot, id: string) => void;
  activeSlot: Slot | null;
  onSlotChange: (slot: Slot) => void;
  /** Optional: show only these tabs (the photo studio hides furniture). Omit to show all. */
  slots?: Slot[];
}

/** Product photo, else photo texture, else flat colour. */
function Swatch({ product }: { product: Product }) {
  const photo = PRODUCT_IMAGES[product.id];
  const tex = TEXTURES[product.id];

  if (photo) {
    return (
      <span className="block h-24 overflow-hidden rounded-lg bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" loading="lazy" className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className="relative block h-14 overflow-hidden rounded-lg" style={{ backgroundColor: product.color }}>
      {tex && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tex.src}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `rotate(${tex.rotate ?? 0}deg) scale(${tex.rotate ? 1.8 : 1})` }}
        />
      )}
    </span>
  );
}

export default function MaterialLibrary({ design, onSelect, activeSlot, onSlotChange, slots }: Props) {
  const tabs = slots ? SLOTS.filter((s) => slots.includes(s.id)) : SLOTS;
  // if the requested tab is not offered (e.g. "sofa" in photo mode), fall back to the first one
  const active: Slot = tabs.some((t) => t.id === activeSlot) ? (activeSlot as Slot) : (tabs[0]?.id ?? "floor");
  const items = PRODUCTS.filter((p) => p.slot === active);

  return (
    <section aria-label="Material library" className="rounded-2xl bg-white/70 p-4 shadow-sm">
      <h2 className="font-serif text-xl text-navy">Material Library</h2>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist">
        {tabs.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={active === s.id}
            onClick={() => onSlotChange(s.id)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              active === s.id ? "bg-navy text-white" : "bg-cream text-ink hover:bg-gold/30"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {items.map((p) => {
          const selected = design[p.slot] === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.slot, p.id)}
                aria-pressed={selected}
                className={`w-full rounded-xl border-2 p-2 text-left transition ${
                  selected ? "border-gold bg-white" : "border-transparent bg-white/80 hover:border-navy/30"
                }`}
              >
                <Swatch product={p} />
                <span className="mt-2 block text-sm font-medium leading-tight">{p.name}</span>
                <span className="text-xs text-ink/60">
                  {money(p.price)}
                  {p.unit === "sqm" ? " / sqm" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}