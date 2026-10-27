"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { THEMES } from "@/data/themes";
import { PRODUCTS_BY_ID } from "@/data/products";
import { CURRENCY } from "@/lib/config";

// Normalized (x%, y%) pin positions on the room preview for each slot
const SLOT_HOTSPOTS: Record<string, { x: number; y: number; label: string }> = {
  floor:   { x: 50, y: 84, label: "Flooring" },
  wall:    { x: 22, y: 38, label: "Wall Finish" },
  joinery: { x: 78, y: 45, label: "Media Wall" },
  sofa:    { x: 52, y: 62, label: "Seating" },
};

export default function FamousBuilds() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [openPin, setOpenPin] = useState<string | null>(null);

  const filteredThemes =
    activeFilter === "all"
      ? THEMES
      : THEMES.filter((t) => t.id === activeFilter);

  return (
    <section id="builds" className="mx-auto max-w-7xl px-4 pt-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            Interactive Lookbooks
          </span>
          <h2 className="mt-1 font-serif text-3xl text-navy">Famous Builds</h2>
          <p className="mt-1 text-ink/70">
            Click the hotspot pins on any room to inspect materials, or load the full look in the studio.
          </p>
        </div>

        {/* Filter by Theme Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeFilter === "all"
                ? "bg-navy text-white shadow-sm"
                : "bg-white text-ink/70 hover:bg-cream"
            }`}
          >
            All Styles
          </button>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveFilter(t.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeFilter === t.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-ink/70 hover:bg-cream"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredThemes.map((t) => {
          const designMap = (t as unknown as { design?: Record<string, string> }).design ?? {};

          return (
            <li
              key={t.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/5 transition hover:shadow-xl"
            >
              {/* Shoppable Room Scene with Clickable Hotspots */}
              <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                {/* Dark gradient overlay on hover for hotspot visibility */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-60 transition group-hover:opacity-80" />

                {/* Interactive Hotspot Pins */}
                {Object.entries(SLOT_HOTSPOTS).map(([slotKey, pos]) => {
                  const prodId = designMap[slotKey];
                  const product = prodId ? PRODUCTS_BY_ID[prodId] : null;
                  if (!product) return null;

                  const pinKey = `${t.id}-${slotKey}`;
                  const isOpen = openPin === pinKey;

                  return (
                    <div
                      key={pinKey}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    >
                      <button
                        type="button"
                        aria-label={`Inspect ${product.name}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenPin(isOpen ? null : pinKey);
                        }}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md transition-transform ${
                          isOpen
                            ? "scale-125 bg-gold text-navy"
                            : "bg-navy/90 text-white hover:scale-110"
                        }`}
                      >
                        +
                      </button>

                      {/* Hotspot Popover Card */}
                      {isOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-8 left-1/2 z-20 w-44 -translate-x-1/2 rounded-xl bg-white p-2.5 text-left shadow-xl ring-1 ring-black/10"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gold">
                            {pos.label}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-navy">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-ink/60">
                            {CURRENCY}
                            {product.price}
                            {product.unit === "sqm" ? " / sqm" : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Theme Info & Action */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="font-serif text-lg text-navy">{t.name}</h3>
                  <p className="mt-1 text-sm text-ink/60">{t.blurb}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                  <Link
                    href={`/photo-studio?theme=${t.id}`}
                    className="text-xs font-semibold text-navy hover:text-gold"
                  >
                    Try on My Photo →
                  </Link>
                  <Link
                    href={`/theme/${t.id}`}
                    className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-navy transition hover:bg-gold/30"
                  >
                    Customize 3D
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}