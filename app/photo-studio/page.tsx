
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BillPanel from "@/components/BillPanel";
import FurnitureBar from "@/components/photo/FurnitureBar";
import PhotoCanvas from "@/components/photo/PhotoCanvas";
import PhotoInstructions from "@/components/photo/PhotoInstructions";
import PhotoToolbar from "@/components/photo/PhotoToolbar";
import PhotoUpload from "@/components/photo/PhotoUpload";
import { PRODUCTS, PRODUCTS_BY_ID } from "@/data/products";
import {
  EMPTY_DESIGN,
  FURNITURE_WIDTH,
  ROOM_AREA_SQM,
} from "@/lib/config";
import {
  isComplete,
  usePhotoDesign,
  type AreaType,
  type SegmentationResponse,
} from "@/hooks/usePhotoDesign";
import {
  generateDesigns,
  type GeneratedDesign,
} from "@/lib/design-engine";
import { buildBill } from "@/lib/pricing";
import type { Design, Slot } from "@/lib/types";

const AREA_SLOTS: AreaType[] = ["floor", "wall", "ceiling"];

const EDITABLE_SLOTS: Slot[] = [
  "floor",
  "wall",
  "ceiling",
  "curtain",
  "sofa",
  "table",
  "joinery",
];

const isAreaSlot = (slot: Slot): slot is AreaType =>
  AREA_SLOTS.includes(slot as AreaType);

export default function PhotoStudioPage() {
  const {
    photoUrl,
    setPhoto,
    removePhoto,
    areas,
    addPoint,
    closeArea,
    finish,
    canFinish,
    setPoints,
    movePoint,
    insertPoint,
    removePoint,
    undoPoint,
    clearType,
    removeArea,
    canUndo,
    products,
    setProduct,
    activeType,
    setActiveType,
    furniture,
    addFurniture,
    updateFurniture,
    removeFurniture,
    selectedFurnitureId,
    setSelectedFurnitureId,
    importSegmentation,
  } = usePhotoDesign();

  const [withFitting, setWithFitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);

  const [generatedDesigns, setGeneratedDesigns] = useState<
    GeneratedDesign[]
  >([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(
    null,
  );

  const [editSlot, setEditSlot] = useState<Slot>("floor");
  const [showEditOptions, setShowEditOptions] = useState(false);

  // Adapt area-keyed products to the existing pricing API.
  // The current buildBill API supports only one product per slot.
  const design: Design = useMemo(() => {
    const result = { ...EMPTY_DESIGN };

    for (const slot of AREA_SLOTS) {
      const area = areas.find((item) => item.type === slot);
      result[slot] = area ? products[area.id] ?? null : null;
    }

    return result;
  }, [areas, products]);

  const extras = useMemo(() => {
    const counts = new Map<string, number>();

    furniture.forEach((item) => {
      counts.set(
        item.productId,
        (counts.get(item.productId) ?? 0) + 1,
      );
    });

    return Array.from(counts, ([productId, qty]) => ({
      productId,
      qty,
    }));
  }, [furniture]);

  const bill = useMemo(
    () => buildBill(design, withFitting, extras),
    [design, withFitting, extras],
  );

  const selectedItem = furniture.find(
    (item) => item.id === selectedFurnitureId,
  );

  const applyDesign = (nextDesign: GeneratedDesign) => {
    // Apply the selected material to each individual area.
    for (const area of areas) {
      if (area.type === "window") continue;

      setProduct(
        area.id,
        nextDesign.areaProducts[area.id] ?? null,
      );
    }

    // Replace furniture from the previous design.
    furniture.forEach((item) => removeFurniture(item.id));

    nextDesign.furnitureProductIds.forEach((productId) => {
      const product = PRODUCTS_BY_ID[productId];
      if (!product) return;

      addFurniture(
        productId,
        FURNITURE_WIDTH[product.slot] ?? 0.25,
      );
    });

    // Curtains use the existing furniture overlay.
    if (nextDesign.curtainProductId) {
      addFurniture(
        nextDesign.curtainProductId,
        FURNITURE_WIDTH.curtain ?? 0.25,
      );
    }

    setSelectedDesignId(nextDesign.id);
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setSegmentError(null);
    setGeneratedDesigns([]);
    setSelectedDesignId(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/segment-room",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to analyze room.");
      }

      const data: SegmentationResponse = await response.json();

      // Import polygons into the existing hook.
      importSegmentation(data);

      // Generate all design options from the detected area IDs.
      const detectedAreas = data.areas.length
        ? data.areas
        : [];

      // Use the same mapper as the hook to preserve area IDs.
      const { mapSegmentationAreas } = await import(
        "@/hooks/usePhotoDesign"
      );

      const mappedAreas = mapSegmentationAreas(data);

      if (mappedAreas.length === 0) {
        throw new Error("No usable room areas were detected.");
      }

      const designs = generateDesigns(mappedAreas);
      setGeneratedDesigns(designs);

      // Automatically apply the first design.
      if (designs.length > 0) {
        applyDesign(designs[0]);
      }
    } catch (error: unknown) {
      console.error("Room design error:", error);
      setSegmentError(
        error instanceof Error
          ? error.message
          : "Could not analyze this room photo.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTypeChange = (type: AreaType) => {
    setActiveType(type);
  };

  const handleBillRemove = (slot: Slot) => {
    if (isAreaSlot(slot)) {
      areas
        .filter((area) => area.type === slot)
        .forEach((area) => setProduct(area.id, null));
      return;
    }

    const lastItem = [...furniture]
      .reverse()
      .find((item) => PRODUCTS_BY_ID[item.productId]?.slot === slot);

    if (lastItem) removeFurniture(lastItem.id);
  };

  const clearDesign = () => {
    areas.forEach((area) => {
      if (area.type !== "window") {
        setProduct(area.id, null);
      }
    });

    furniture.forEach((item) => removeFurniture(item.id));
    setGeneratedDesigns([]);
    setSelectedDesignId(null);
  };

  // Edit one category without asking the user to build the whole room.
  const replaceProduct = (productId: string) => {
    const product = PRODUCTS_BY_ID[productId];
    if (!product) return;

    if (isAreaSlot(editSlot)) {
      const matchingAreas = areas.filter(
        (area) => area.type === editSlot,
      );

      matchingAreas.forEach((area) => {
        setProduct(area.id, productId);
      });

      return;
    }

    // Replace the existing furniture item(s) in the chosen category.
    furniture
      .filter((item) => PRODUCTS_BY_ID[item.productId]?.slot === editSlot)
      .forEach((item) => removeFurniture(item.id));

    addFurniture(
      productId,
      FURNITURE_WIDTH[editSlot] ?? 0.25,
    );
  };

  const selectedEditProducts = PRODUCTS.filter(
    (product) => product.slot === editSlot,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-navy hover:underline">
          ← Back to Home
        </Link>

        <span className="text-ink/30">|</span>

        <h1 className="font-serif text-2xl text-navy">
          AI Room Designer
        </h1>

        <span className="ml-auto rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-navy">
          BETA
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_330px]">
        <section aria-label="Room design workspace" className="space-y-4">
          <PhotoUpload
            onPhotoSelect={setPhoto}
            onFileSelect={handleFileSelect}
            onRemove={() => {
              removePhoto();
              setGeneratedDesigns([]);
              setSelectedDesignId(null);
            }}
            photoUrl={photoUrl}
          />

          {isProcessing && (
            <div className="animate-pulse rounded-xl bg-navy/5 p-3 text-center text-sm font-medium text-navy">
              AI is analyzing your room and preparing design options...
            </div>
          )}

          {segmentError && (
            <p role="alert" className="text-sm text-red-600">
              {segmentError}
            </p>
          )}

          {photoUrl && (
            <>
              {generatedDesigns.length > 0 && (
                <section className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl text-navy">
                        Your AI Designs
                      </h2>
                      <p className="mt-1 text-sm text-ink/60">
                        Choose a complete look. You can edit individual items later.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {generatedDesigns.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyDesign(item)}
                        className={`rounded-xl border p-4 text-left transition ${
                          selectedDesignId === item.id
                            ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                            : "border-navy/10 hover:border-navy/40"
                        }`}
                      >
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                          Design {index + 1}
                        </span>

                        <span className="block font-semibold text-navy">
                          {item.name}
                        </span>

                        <span className="mt-1 block text-sm text-ink/70">
                          {item.blurb}
                        </span>

                        <span className="mt-3 block text-xs font-semibold text-navy">
                          {selectedDesignId === item.id
                            ? "✓ Currently applied"
                            : "Apply this design"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEditOptions((open) => !open)}
                    className="mt-4 rounded-lg border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
                  >
                    {showEditOptions ? "Close edit options" : "Edit one item"}
                  </button>

                  {showEditOptions && (
                    <div className="mt-4 space-y-3 border-t border-navy/10 pt-4">
                      <label
                        htmlFor="edit-slot"
                        className="block text-sm font-medium text-navy"
                      >
                        What would you like to change?
                      </label>

                      <select
                        id="edit-slot"
                        value={editSlot}
                        onChange={(event) =>
                          setEditSlot(event.target.value as Slot)
                        }
                        className="w-full rounded-lg border border-navy/20 bg-white p-2 text-sm"
                      >
                        {EDITABLE_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot.charAt(0).toUpperCase() + slot.slice(1)}
                          </option>
                        ))}
                      </select>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {selectedEditProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => replaceProduct(product.id)}
                            className="rounded-lg border border-navy/10 p-3 text-left hover:border-navy/40 hover:bg-navy/5"
                          >
                            <span className="block text-sm font-medium text-navy">
                              {product.name}
                            </span>
                            <span className="mt-1 block text-xs text-ink/60">
                              £{product.price} / {product.unit}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <PhotoToolbar
                activeType={activeType}
                onTypeChange={handleTypeChange}
                onUndo={undoPoint}
                onClear={() => clearType(activeType)}
                canUndo={canUndo}
                onFinish={finish}
                canFinish={canFinish}
              />

              <PhotoCanvas
                photoUrl={photoUrl}
                areas={areas}
                products={products}
                activeType={activeType}
                furniture={furniture}
                selectedFurnitureId={selectedFurnitureId}
                onAddPoint={addPoint}
                onClose={closeArea}
                onMovePoint={movePoint}
                onSetPoints={setPoints}
                onInsertPoint={insertPoint}
                onRemovePoint={removePoint}
                onFurnitureSelect={setSelectedFurnitureId}
                onFurnitureUpdate={updateFurniture}
              />

              {selectedItem && (
                <FurnitureBar
                  item={selectedItem}
                  onUpdate={(patch) =>
                    updateFurniture(selectedItem.id, patch)
                  }
                  onRemove={() => removeFurniture(selectedItem.id)}
                />
              )}

              {areas.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold text-navy">
                    Detected Areas ({areas.length})
                  </h3>

                  <ul className="space-y-1.5">
                    {areas.map((area) => {
                      const productId =
                        area.type === "window"
                          ? null
                          : products[area.id];

                      const product = productId
                        ? PRODUCTS_BY_ID[productId]
                        : undefined;

                      return (
                        <li
                          key={area.id}
                          className="flex items-center justify-between rounded-lg border border-navy/10 px-3 py-2 text-sm"
                        >
                          <span>
                            <span className="font-medium capitalize">
                              {area.type}
                            </span>
                            <span className="ml-2 text-xs text-ink/60">
                              {isComplete(area)
                                ? product?.name ??
                                  (area.type === "window"
                                    ? "Not paintable"
                                    : "No material applied")
                                : `${area.points.length} points`}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => removeArea(area.id)}
                            aria-label={`Remove ${area.type}`}
                            className="text-xs text-ink/50 hover:text-ink"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <p className="text-xs text-ink/50">
                Prices currently use an estimated {ROOM_AREA_SQM} sqm floor.
                Final quantities depend on measured room dimensions.
              </p>
            </>
          )}

          <PhotoInstructions />
        </section>

        <aside className="lg:sticky lg:top-20">
          <BillPanel
            bill={bill}
            withFitting={withFitting}
            onFittingChange={setWithFitting}
            onRemove={handleBillRemove}
            onReset={clearDesign}
          />
        </aside>
      </div>
    </div>
  );
}
