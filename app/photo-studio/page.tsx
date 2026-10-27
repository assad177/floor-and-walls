"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BillPanel from "@/components/BillPanel";
import FurnitureBar from "@/components/photo/FurnitureBar";
import PhotoCanvas from "@/components/photo/PhotoCanvas";
import PhotoUpload from "@/components/photo/PhotoUpload";
import PhotoInstructions from "@/components/photo/PhotoInstructions";
import { PRODUCTS, PRODUCTS_BY_ID } from "@/data/products";
import {
  EMPTY_DESIGN,
  FURNITURE_WIDTH,
  ROOM_AREA_SQM,
} from "@/lib/config";
import {
  mapSegmentationAreas,
  usePhotoDesign,
  type Area,
  type AreaType,
  type SegmentationResponse,
} from "@/hooks/usePhotoDesign";
import type { GeneratedDesign } from "@/lib/design-engine";
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

interface ApiPlacement {
  id: string;
  slot: Slot;
  productId: string;
  x: number;
  y: number;
  scale: number;
  scaleY?: number;
  rotation?: number;
  angle?: number;
  flipped?: boolean;
}

interface ApiGeneratedDesign {
  id: string;
  name: string;
  blurb: string;
  products?: Partial<Record<AreaType, string | null>>;
  placements?: ApiPlacement[];
}

const isAreaSlot = (slot: string): slot is AreaType =>
  AREA_SLOTS.includes(slot as AreaType);

export default function PhotoStudioPage() {
  const {
    photoUrl,
    setPhoto,
    removePhoto,
    areas,
    removeArea,
    products,
    setProduct,
    furniture,
    addFurniture,
    updateFurniture,
    removeFurniture,
    clearFurniture,
    selectedFurnitureId,
    setSelectedFurnitureId,
    importSegmentation,
  } = usePhotoDesign();

  const [withFitting, setWithFitting] = useState(false);
  const [processingStep, setProcessingStep] = useState<"idle" | "segmenting" | "generating">("idle");
  const [segmentError, setSegmentError] = useState<string | null>(null);

  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const [editSlot, setEditSlot] = useState<Slot>("floor");
  const [showEditOptions, setShowEditOptions] = useState(false);

  const isProcessing = processingStep !== "idle";

  const design: Design = useMemo(() => {
    const result = { ...EMPTY_DESIGN };
    for (const slot of AREA_SLOTS) {
      const area = areas.find((item) => item.type === slot);
      (result as Record<string, string | null>)[slot] = area
        ? products[area.id] ?? null
        : null;
    }
    return result;
  }, [areas, products]);

  const extras = useMemo(() => {
    const counts = new Map<string, number>();
    furniture.forEach((item) => {
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
    });
    return Array.from(counts, ([productId, qty]) => ({ productId, qty }));
  }, [furniture]);

  const bill = useMemo(
    () => buildBill(design, withFitting, extras),
    [design, withFitting, extras]
  );

  const selectedItem = furniture.find((item) => item.id === selectedFurnitureId);

  const applyDesign = (nextDesign: GeneratedDesign, freshAreas?: Area[]) => {
    const effectiveAreas = freshAreas ?? areas;

    for (const area of effectiveAreas) {
      if (area.type === "window") continue;
      setProduct(area.id, nextDesign.areaProducts[area.id] ?? null);
    }

    clearFurniture();

    if (nextDesign.placements && nextDesign.placements.length > 0) {
      nextDesign.placements.forEach((placement) => {
        if (!PRODUCTS_BY_ID[placement.productId]) return;
        addFurniture(placement.productId, placement.scale, {
          x: placement.x,
          y: placement.y,
          scaleY: (placement as ApiPlacement).scaleY,
          angle: (placement as ApiPlacement).angle,
          rotation: placement.rotation,
          flipped: (placement as ApiPlacement).flipped,
        });
      });
    } else {
      nextDesign.furnitureProductIds.forEach((productId) => {
        const product = PRODUCTS_BY_ID[productId];
        if (!product) return;
        addFurniture(productId, FURNITURE_WIDTH[product.slot] ?? 0.25);
      });

      if (nextDesign.curtainProductId) {
        addFurniture(
          nextDesign.curtainProductId,
          FURNITURE_WIDTH.curtain ?? 0.25
        );
      }
    }

    setSelectedFurnitureId(null);
    setSelectedDesignId(nextDesign.id);
  };

  const handleFileSelect = async (file: File) => {
    setProcessingStep("segmenting");
    setSegmentError(null);
    setGeneratedDesigns([]);
    setSelectedDesignId(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const analyzeRes = await fetch("/api/analyze-room", {
        method: "POST",
        body: formData,
      });

      const analyzeResult = await analyzeRes.json();
      if (!analyzeRes.ok) {
        throw new Error(analyzeResult.error || "Failed to analyze room.");
      }

      const data: SegmentationResponse = analyzeResult.segmentation;
      importSegmentation(data);

      const mappedAreas = mapSegmentationAreas(data);
      if (mappedAreas.length === 0) {
        throw new Error("No usable room areas were detected.");
      }

      setProcessingStep("generating");

      const generateRes = await fetch("/api/generate-designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeResult),
      });

      const generateResult = await generateRes.json();
      if (!generateRes.ok) {
        throw new Error(generateResult.error || "Failed to generate designs.");
      }

      const rawDesigns: ApiGeneratedDesign[] = generateResult.designs ?? [];

      const aiDesigns: GeneratedDesign[] = rawDesigns.map((d) => {
        const placements = d.placements ?? [];
        const curtainPlacement = placements.find((p) => p.slot === "curtain");
        const furniturePlacements = placements.filter((p) => p.slot !== "curtain");

        return {
          id: d.id,
          name: d.name,
          blurb: d.blurb,
          areaProducts: Object.fromEntries(
            mappedAreas
              .filter((area) => ["floor", "wall", "ceiling"].includes(area.type))
              .map((area) => [area.id, d.products?.[area.type] ?? null])
          ),
          furnitureProductIds: furniturePlacements.map((p) => p.productId),
          curtainProductId: curtainPlacement?.productId ?? null,
          placements,
        };
      });

      if (aiDesigns.length === 0) {
        throw new Error("AI did not return any design options.");
      }

      setGeneratedDesigns(aiDesigns);
      applyDesign(aiDesigns[0], mappedAreas);
    } catch (error: unknown) {
      console.error("Room design error:", error);
      setSegmentError(
        error instanceof Error
          ? error.message
          : "Could not analyze this room photo."
      );
    } finally {
      setProcessingStep("idle");
    }
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
    clearFurniture();
    setSelectedDesignId(null);
  };

  const replaceProduct = (productId: string) => {
    const product = PRODUCTS_BY_ID[productId];
    if (!product) return;

    if (isAreaSlot(editSlot)) {
      areas
        .filter((area) => area.type === editSlot)
        .forEach((area) => setProduct(area.id, productId));
      return;
    }

    const existingItems = furniture.filter(
      (item) => PRODUCTS_BY_ID[item.productId]?.slot === editSlot
    );

    if (existingItems.length > 0) {
      existingItems.forEach((item) =>
        updateFurniture(item.id, { productId })
      );
    } else {
      addFurniture(productId, FURNITURE_WIDTH[editSlot] ?? 0.25);
    }
  };

  const selectedEditProducts = PRODUCTS.filter(
    (product) => product.slot === editSlot
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-navy hover:underline">
          ← Back to Home
        </Link>
        <span className="text-ink/30">|</span>
        <h1 className="font-serif text-2xl text-navy">AI Room Designer</h1>
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

          {segmentError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
                        Choose a complete look. You can customize individual items or drag furniture below.
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

              <PhotoCanvas
                photoUrl={photoUrl}
                areas={areas}
                products={products}
                furniture={furniture}
                selectedFurnitureId={selectedFurnitureId}
                isLoading={isProcessing}
                loadingText={
                  processingStep === "segmenting"
                    ? "Step 1/2: AI is detecting walls, floor, ceiling & windows…"
                    : "Step 2/2: Generating 4 custom floor-to-ceiling room designs…"
                }
                onFurnitureSelect={setSelectedFurnitureId}
                onFurnitureUpdate={updateFurniture}
              />

              {selectedItem && (
                <FurnitureBar
                  item={selectedItem}
                  onUpdate={(patch) => updateFurniture(selectedItem.id, patch)}
                  onRemove={() => removeFurniture(selectedItem.id)}
                />
              )}

              {areas.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold text-navy">
                    Detected Surfaces ({areas.length})
                  </h3>

                  <ul className="space-y-1.5">
                    {areas.map((area) => {
                      const productId =
                        area.type === "window" ? null : products[area.id];
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
                              {product?.name ??
                                (area.type === "window"
                                  ? "Window (Curtain target)"
                                  : "No material applied")}
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
          <PhotoInstructions/>
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