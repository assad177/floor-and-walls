import { PRODUCTS } from "@/data/products";
import type { Product, Slot } from "@/lib/types";

export interface DesignArea {
  id: string;
  type: "floor" | "wall" | "ceiling" | "window";
}

export interface DesignPlacement {
  id: string;
  slot: string;
  productId: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
}

export interface GeneratedDesign {
  id: string;
  name: string;
  blurb: string;
  areaProducts: Record<string, string | null>;
  furnitureProductIds: string[];
  curtainProductId: string | null;
  placements?: DesignPlacement[]; // AI & Geometry coordinates yahan store honge
}

interface DesignStyle {
  id: string;
  name: string;
  blurb: string;
  preferred: Partial<Record<Slot, string[]>>;
}

const STYLES: DesignStyle[] = [
  {
    id: "warm-neutral",
    name: "Warm Neutral",
    blurb: "Cream walls, natural oak flooring and warm wood furniture.",
    preferred: {
      floor: ["floor-oak", "floor-carpet", "floor-grey-lvp"],
      wall: ["wall-cream", "wall-sage"],
      ceiling: ["ceiling-white", "ceiling-warm"],
      curtain: ["curtain-linen", "blind-grey"],
      sofa: ["sofa-beige", "sofa-grey", "sofa-terracotta"],
      table: ["table-oak", "table-black"],
      joinery: ["joinery-walnut", "joinery-slat"],
    },
  },
  {
    id: "natural-green",
    name: "Natural Green",
    blurb: "Calming sage tones, soft flooring and natural materials.",
    preferred: {
      floor: ["floor-grey-lvp", "floor-oak", "floor-carpet2"],
      wall: ["wall-sage", "wall-cream"],
      ceiling: ["ceiling-warm", "ceiling-white"],
      curtain: ["curtain-linen", "curtain-green"],
      sofa: ["sofa-beige", "sofa-grey", "sofa-navy"],
      table: ["table-oak", "table-black"],
      joinery: ["joinery-slat", "joinery-walnut"],
    },
  },
  {
    id: "modern-contrast",
    name: "Modern Contrast",
    blurb: "Bold accent walls with contrasting furniture and finishes.",
    preferred: {
      floor: ["floor-oak", "floor-grey-lvp", "floor-tile"],
      wall: ["wall-navy", "wall-cream", "wall-charcoal"],
      ceiling: ["ceiling-white", "ceiling-warm"],
      curtain: ["curtain-linen", "curtain-green", "blind-grey"],
      sofa: ["sofa-beige", "sofa-grey", "sofa-terracotta"],
      table: ["table-black", "table-oak"],
      joinery: ["joinery-navy", "joinery-walnut"],
    },
  },
  {
    id: "contemporary",
    name: "Contemporary",
    blurb: "Charcoal accents, refined wood finishes and clean lines.",
    preferred: {
      floor: ["floor-grey-lvp", "floor-tile", "floor-oak"],
      wall: ["wall-charcoal", "wall-cream", "wall-sage"],
      ceiling: ["ceiling-white", "ceiling-coffered", "ceiling-warm"],
      curtain: ["blind-grey", "curtain-linen", "curtain-green"],
      sofa: ["sofa-grey", "sofa-beige", "sofa-navy"],
      table: ["table-black", "table-oak"],
      joinery: ["joinery-walnut", "joinery-navy"],
    },
  },
];

function getProduct(
  slot: Slot,
  preferredIds: string[],
  styleIndex: number,
  variantIndex = 0,
): Product | undefined {
  const available = PRODUCTS.filter((product) => product.slot === slot);

  if (available.length === 0) return undefined;

  const preferred = preferredIds
    .map((id) => available.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);

  if (preferred.length > 0) {
    return preferred[variantIndex % preferred.length];
  }

  return available[styleIndex % available.length];
}

export function generateDesigns(areas: DesignArea[]): GeneratedDesign[] {
  const hasWindow = areas.some((area) => area.type === "window");

  return STYLES.map((style, styleIndex) => {
    const areaProducts: Record<string, string | null> = {};

    for (const area of areas) {
      // Never apply paint/material directly to windows.
      if (area.type === "window") {
        areaProducts[area.id] = null;
        continue;
      }

      const product = getProduct(
        area.type,
        style.preferred[area.type] ?? [],
        styleIndex,
      );

      areaProducts[area.id] = product?.id ?? null;
    }

    const furnitureSlots: Slot[] = ["sofa", "table", "joinery"];

    const furnitureProductIds = furnitureSlots.flatMap((slot) => {
      const product = getProduct(
        slot,
        style.preferred[slot] ?? [],
        styleIndex,
      );

      return product ? [product.id] : [];
    });

    const curtain = hasWindow
      ? getProduct("curtain", style.preferred.curtain ?? [], styleIndex)
      : undefined;

    return {
      id: style.id,
      name: style.name,
      blurb: style.blurb,
      areaProducts,
      furnitureProductIds,
      curtainProductId: curtain?.id ?? null,
    };
  });
}