"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BillPanel from "@/components/BillPanel";
import MaterialLibrary from "@/components/MaterialLibrary";
import FurnitureBar from "@/components/photo/FurnitureBar";
import PhotoCanvas from "@/components/photo/PhotoCanvas";
import PhotoInstructions from "@/components/photo/PhotoInstructions";
import PhotoToolbar from "@/components/photo/PhotoToolbar";
import PhotoUpload from "@/components/photo/PhotoUpload";
import { PRODUCTS_BY_ID } from "@/data/products";
import { EMPTY_DESIGN, FURNITURE_WIDTH, ROOM_AREA_SQM } from "@/lib/config";
import {
  isComplete,
  usePhotoDesign,
  type AreaType,
} from "@/hooks/usePhotoDesign";
import { buildBill } from "@/lib/pricing";
import type { Design, Slot } from "@/lib/types";

const AREA_SLOTS: AreaType[] = ["floor", "wall", "ceiling"];

const FURNITURE_SLOTS: Slot[] = ["sofa", "table", "curtain", "joinery"];
const LIBRARY_SLOTS: Slot[] = [...AREA_SLOTS, ...FURNITURE_SLOTS];

const isAreaSlot = (s: Slot): s is AreaType => (AREA_SLOTS as Slot[]).includes(s);
const isFurnitureSlot = (s: Slot) => FURNITURE_SLOTS.includes(s);

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
  } = usePhotoDesign();

  const [withFitting, setWithFitting] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot>("floor");
  const [isProcessing, setIsProcessing] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);

  // Bill is built from what the photo shows
  const design: Design = useMemo(
    () => ({ ...EMPTY_DESIGN, ...products }),
    [products],
  );

  const extras = useMemo(() => {
    const counts = new Map<string, number>();
    furniture.forEach((f) =>
      counts.set(f.productId, (counts.get(f.productId) ?? 0) + 1),
    );
    return Array.from(counts, ([productId, qty]) => ({ productId, qty }));
  }, [furniture]);

  const bill = useMemo(
    () => buildBill(design, withFitting, extras),
    [design, withFitting, extras],
  );

  const selectedItem = furniture.find((f) => f.id === selectedFurnitureId);

  // FastAPI Backend par image bhej kar polygons detect karane ka function
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setSegmentError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/segment-room", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process room image on backend.");
      }

      const data = await response.json();
      console.log("AI Segmentation Response:", data);
      
      // Yahan aap backend ke response (data.areas) ko canvas par set kar sakte hain 
      // misal ke taur par agar hook mein setAreas function available ho.

    } catch (err: any) {
      console.error("Segmentation error:", err);
      setSegmentError("Could not analyze the room photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelect = (slot: Slot, id: string) => {
    if (isAreaSlot(slot)) {
      setProduct(slot, products[slot] === id ? null : id);
    } else if (isFurnitureSlot(slot)) {
      addFurniture(id, FURNITURE_WIDTH[slot] ?? 0.25);
    }
  };

  const handleTypeChange = (t: AreaType) => {
    setActiveType(t);
    setActiveSlot(t);
  };
  const handleSlotChange = (s: Slot) => {
    setActiveSlot(s);
    if (isAreaSlot(s)) setActiveType(s);
  };

  const handleBillRemove = (slot: Slot) => {
    if (isAreaSlot(slot)) return setProduct(slot, null);
    const last = [...furniture]
      .reverse()
      .find((f) => PRODUCTS_BY_ID[f.productId]?.slot === slot);
    if (last) removeFurniture(last.id);
  };

  const clearDesign = () => {
    AREA_SLOTS.forEach((t) => setProduct(t, null));
    furniture.forEach((f) => removeFurniture(f.id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-navy hover:underline">
          ← Back to Home
        </Link>
        <span className="text-ink/30">|</span>
        <h1 className="font-serif text-2xl text-navy">Photo Studio</h1>
        <span className="ml-auto rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-navy">
          BETA
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[300px_1fr_330px]">
        <MaterialLibrary
          design={design}
          onSelect={handleSelect}
          activeSlot={activeSlot}
          onSlotChange={handleSlotChange}
          slots={LIBRARY_SLOTS}
        />

        <section aria-label="Photo canvas" className="space-y-4">
          <PhotoUpload
            onPhotoSelect={setPhoto}
            onFileSelect={handleFileSelect} // FastAPI backend integration
            onRemove={removePhoto}
            photoUrl={photoUrl}
          />

          {isProcessing && (
            <div className="rounded-xl bg-navy/5 p-3 text-center text-sm font-medium text-navy animate-pulse">
              🤖 AI is analyzing your room structure...
            </div>
          )}

          {segmentError && (
            <p className="text-sm text-red-600">{segmentError}</p>
          )}

          {photoUrl ? (
            <>
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
                  onUpdate={(patch) => updateFurniture(selectedItem.id, patch)}
                  onRemove={() => removeFurniture(selectedItem.id)}
                />
              )}

              {areas.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold text-navy">
                    Marked areas ({areas.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {areas.map((area) => {
                      const productId = products[area.type];
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
                                ? product
                                  ? product.name
                                  : "choose a material"
                                : `${area.points.length} points, tap the green point to close`}
                            </span>
                          </span>
                          <button
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
                Prices assume a {ROOM_AREA_SQM} sqm floor until the room size is
                entered.
              </p>
            </>
          ) : null}

          <PhotoInstructions />
        </section>

        <div className="lg:sticky lg:top-20">
          <BillPanel
            bill={bill}
            withFitting={withFitting}
            onFittingChange={setWithFitting}
            onRemove={handleBillRemove}
            onReset={clearDesign}
          />
        </div>
      </div>
    </div>
  );
}