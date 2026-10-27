import type { Slot, Product, Design } from "./types";

export const CURRENCY = "$";
/** Assumed room floor area until the customer can enter their own size. */
export const ROOM_AREA_SQM = 20;
/** Standard architectural reference dimensions in meters (used for metric scale calibration). */
export const ROOM_REFERENCE_METERS = {
  standardRoomWidth: 4.2,
  standardCeilingHeight: 2.55,
  standardDoorHeight: 2.03,
  standardWindowHeight: 1.35,
};

export const WHATSAPP_NUMBER = "";

export const SLOTS: { id: Slot; label: string }[] = [
  { id: "floor", label: "Flooring" },
  { id: "wall", label: "Walls" },
  { id: "ceiling", label: "Ceiling" },
  { id: "curtain", label: "Window" },
  { id: "joinery", label: "Joinery" },
  { id: "sofa", label: "Sofa" },
  { id: "table", label: "Tables" },
];

/** Fitting charge: per sqm for floors, per item for everything else. */
export const FITTING_RATES: Record<Slot, number> = {
  floor: 15,
  wall: 90,
  ceiling: 60,
  curtain: 35,
  joinery: 180,
  sofa: 0,
  table: 0,
};

/** Fallback slot widths if a product has no specific metric entry. */
export const FURNITURE_WIDTH: Partial<Record<Slot, number>> = {
  sofa: 0.34,
  table: 0.16,
  curtain: 0.20,
  joinery: 0.24,
};

/**
 * Physical dimensions (in meters) by product ID or category default.
 * Ensures a 0.90m armchair/plant renders small while a 2.15m sofa renders wide.
 */
export const PRODUCT_DIMENSIONS_M: Record<
  string,
  { width: number; depth: number; height: number }
> = {
  // Specific products
  "sofa-grey":       { width: 0.92, depth: 0.85, height: 0.88 }, // Armchair (chair.png)
  "sofa-beige":      { width: 2.10, depth: 0.92, height: 0.85 }, // 3-Seater Sofa
  "sofa-terracotta": { width: 2.00, depth: 0.90, height: 0.85 },
  "sofa-navy":       { width: 2.15, depth: 0.92, height: 0.88 },
  "plant":           { width: 0.48, depth: 0.48, height: 1.15 }, // Indoor plant
  "table-oak":       { width: 1.05, depth: 0.60, height: 0.45 },
  "table-black":     { width: 1.00, depth: 0.60, height: 0.45 },
  "joinery-slat":    { width: 1.65, depth: 0.35, height: 1.40 },
  "joinery-navy":    { width: 1.60, depth: 0.38, height: 1.35 },
  "joinery-walnut":  { width: 1.75, depth: 0.38, height: 1.45 },
  // Slot-level defaults for any newly added vendor product
  "default:sofa":    { width: 1.95, depth: 0.90, height: 0.85 },
  "default:table":   { width: 1.00, depth: 0.60, height: 0.45 },
  "default:joinery": { width: 1.65, depth: 0.35, height: 1.40 },
  "default:curtain": { width: 1.40, depth: 0.10, height: 2.10 },
};

export function getProductDimensionsM(productId: string, slot?: string) {
  return (
    PRODUCT_DIMENSIONS_M[productId] ??
    PRODUCT_DIMENSIONS_M[`default:${slot ?? "sofa"}`] ??
    { width: 1.2, depth: 0.6, height: 0.8 }
  );
}

/** Items that hang on a wall rather than stand on the floor. */
export const WALL_ITEM_SLOTS: Slot[] = ["joinery", "curtain"];

/** Suggested wall angle (degrees) from an item's horizontal position: left-wall items lean one way, right-wall the other. */
export const autoWallAngle = (x: number): number => {
  // Center back wall (0.35 <= x <= 0.65) stays flat (0 deg); side walls tilt in perspective
  if (x >= 0.36 && x <= 0.64) return 0;
  return Math.round(Math.max(-38, Math.min(38, (0.5 - x) * 95)));
};

/** True for products that hang on a wall (curtains, media walls, mirrors, frames...). */
export const isWallItem = (p: Product | undefined): boolean =>
  p?.placement === "wall" || (!!p?.slot && WALL_ITEM_SLOTS.includes(p.slot));

export const EMPTY_DESIGN: Design = {
  floor: null,
  wall: null,
  ceiling: null,
  curtain: null,
  joinery: null,
  sofa: null,
  table: null,
};