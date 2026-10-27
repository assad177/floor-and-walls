"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { PRODUCTS } from "@/data/products";
import { PRODUCT_IMAGES } from "@/data/productImages";
import { SLOTS, CURRENCY, FITTING_RATES } from "@/lib/config";
import type { Product, Slot } from "@/lib/types";

interface ProductMegaMenuProps {
  visualizerHref?: string;
}

export default function ProductMegaMenu({
  visualizerHref = "#workspace",
}: ProductMegaMenuProps) {
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lengthM, setLengthM] = useState<string>("4");
  const [widthM, setWidthM] = useState<string>("5");
  const [includeFitting, setIncludeFitting] = useState<boolean>(false);

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (slot: Slot) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (activeSlot !== slot) {
      setActiveSlot(slot);
      setSelectedProduct(null);
    }
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveSlot(null);
      setSelectedProduct(null);
    }, 200);
  };

  const activeProducts = activeSlot
    ? PRODUCTS.filter((p) => p.slot === activeSlot)
    : [];

  // Calculate area & price for sqm products (Carpets, Flooring, Ceiling)
  const parsedLength = Math.max(0, parseFloat(lengthM) || 0);
  const parsedWidth = Math.max(0, parseFloat(widthM) || 0);
  const totalAreaSqm = +(parsedLength * parsedWidth).toFixed(2);

  const isSqmProduct = selectedProduct?.unit === "sqm";
  const fittingRate = selectedProduct
    ? FITTING_RATES[selectedProduct.slot] ?? 0
    : 0;

  const materialCost = selectedProduct
    ? isSqmProduct
      ? +(totalAreaSqm * selectedProduct.price).toFixed(2)
      : selectedProduct.price
    : 0;

  const fittingCost =
    selectedProduct && includeFitting
      ? isSqmProduct
        ? +(totalAreaSqm * fittingRate).toFixed(2)
        : fittingRate
      : 0;

  const grandTotal = +(materialCost + fittingCost).toFixed(2);

  return (
    <div
      className="relative z-50 border-y border-slate-200/80 bg-white/95 backdrop-blur-md"
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Centered Top Category Navigation Bar ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-center overflow-x-auto px-4">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          {/* Sleek Brand/Catalogue Badge */}
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Catalogue
          </div>

          <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

          {/* Centered Navigation Links */}
          <nav
            aria-label="Product showcase categories"
            className="flex items-center space-x-6 md:space-x-9"
          >
            {SLOTS.map((slot) => {
              const isActive = activeSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onMouseEnter={() => handleMouseEnter(slot.id)}
                  onFocus={() => handleMouseEnter(slot.id)}
                  onClick={() =>
                    setActiveSlot((prev) =>
                      prev === slot.id ? null : slot.id
                    )
                  }
                  className={`group relative flex shrink-0 items-center gap-1.5 py-4 text-sm font-medium tracking-wide transition-colors ${
                    isActive
                      ? "text-slate-950 font-semibold"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  <span>{slot.label}</span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:text-slate-700 ${
                      isActive ? "rotate-180 text-amber-500" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>

                  {/* Active Amber Bottom Indicator */}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-amber-500 transition-transform duration-200 ${
                      isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-50"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Hover Mega Menu Dropdown ── */}
      {activeSlot && (
        <div
          onMouseEnter={() => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          }}
          className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-2xl"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_300px]">
            {/* Left Side: Product Grid OR Length/Width Estimator */}
            <div>
              {!selectedProduct ? (
                <>
                  <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        {SLOTS.find((s) => s.id === activeSlot)?.label}{" "}
                        Collection
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Select any product below to calculate room dimensions &
                        pricing
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {activeProducts.length} Options
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
                    {activeProducts.map((product) => {
                      const imgSrc =
                        PRODUCT_IMAGES?.[product.id] ?? product.image ?? null;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="group flex flex-col items-center rounded-2xl border border-transparent p-2.5 text-center transition-all hover:border-slate-200 hover:bg-slate-50/70 focus:outline-none"
                        >
                          <div
                            className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-400 group-hover:shadow-md"
                            style={{
                              backgroundColor: product.color || "#F4F4F5",
                            }}
                          >
                            {imgSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imgSrc}
                                alt={product.name}
                                className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${
                                  ["floor", "wall", "ceiling"].includes(
                                    product.slot
                                  )
                                    ? "object-cover"
                                    : "object-contain p-2.5"
                                }`}
                              />
                            ) : (
                              <div
                                className="h-full w-full"
                                style={{
                                  backgroundColor: product.color,
                                  backgroundImage:
                                    product.pattern === "plank"
                                      ? "repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 18px)"
                                      : product.pattern === "tile"
                                        ? "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)"
                                        : product.pattern === "panel"
                                          ? "repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 4px, transparent 4px, transparent 12px)"
                                          : undefined,
                                  backgroundSize:
                                    product.pattern === "tile"
                                      ? "24px 24px"
                                      : undefined,
                                }}
                              />
                            )}
                          </div>

                          <span className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-amber-600">
                            {product.name}
                          </span>
                          <span className="mt-0.5 text-xs font-medium text-slate-400">
                            {CURRENCY}
                            {product.price} / {product.unit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* ── Selected Product Length × Width Calculator ── */
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                    >
                      ← Back to{" "}
                      {SLOTS.find((s) => s.id === activeSlot)?.label}
                    </button>
                    <span className="rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-900">
                      {CURRENCY}
                      {selectedProduct.price} / {selectedProduct.unit}
                    </span>
                  </div>

                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div
                      className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
                      style={{ backgroundColor: selectedProduct.color }}
                    >
                      {(PRODUCT_IMAGES?.[selectedProduct.id] ??
                        selectedProduct.image) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            PRODUCT_IMAGES?.[selectedProduct.id] ??
                            selectedProduct.image
                          }
                          alt={selectedProduct.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedProduct.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {isSqmProduct
                            ? "Enter your room Length and Width in meters to calculate total area and cost."
                            : "Standard unit price item."}
                        </p>
                      </div>

                      {isSqmProduct && (
                        <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700">
                              Length (m)
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.1"
                              value={lengthM}
                              onChange={(e) => setLengthM(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700">
                              Width (m)
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.1"
                              value={widthM}
                              onChange={(e) => setWidthM(e.target.value)}
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {fittingRate > 0 && (
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={includeFitting}
                            onChange={(e) =>
                              setIncludeFitting(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          />
                          Include professional fitting ({CURRENCY}
                          {fittingRate} / {selectedProduct.unit})
                        </label>
                      )}

                      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        {isSqmProduct && (
                          <div>
                            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                              Total Area
                            </span>
                            <span className="text-sm font-bold text-slate-800">
                              {totalAreaSqm} sqm
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            Material Cost
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {CURRENCY}
                            {materialCost}
                          </span>
                        </div>
                        {includeFitting && fittingCost > 0 && (
                          <div>
                            <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                              Fitting Cost
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                              {CURRENCY}
                              {fittingCost}
                            </span>
                          </div>
                        )}
                        <div className="ml-auto text-right">
                          <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            Estimated Total
                          </span>
                          <span className="text-lg font-extrabold text-amber-600">
                            {CURRENCY}
                            {grandTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Visualizer Promo Card */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-sm">
              <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-slate-100 px-6 pt-6 pb-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="font-serif text-xl font-bold tracking-tight text-slate-900">
                    Picture<span className="text-amber-500">IT</span>
                  </span>
                </div>

                <div className="relative flex h-36 w-28 flex-col justify-end overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-700 p-2 shadow-lg">
                  <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-amber-50 to-amber-100/70" />
                  <div className="relative z-10 grid grid-cols-3 gap-1 rounded bg-black/70 p-1">
                    <span className="h-4 rounded-sm bg-[#C8A06B]" />
                    <span className="h-4 rounded-sm bg-[#A7B59E]" />
                    <span className="h-4 rounded-sm bg-[#2C4A73]" />
                  </div>
                </div>
              </div>

              <div className="bg-[#D6E6F2] p-5">
                <h4 className="text-sm font-bold text-slate-900">
                  AI Room Visualiser
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  Bring your flooring & interior ideas to life in seconds.
                </p>
                <Link
                  href={visualizerHref}
                  onClick={() => setActiveSlot(null)}
                  className="mt-4 inline-block rounded-lg border border-slate-800 bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Visualising
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}