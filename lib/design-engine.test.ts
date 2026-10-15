
import { describe, expect, it } from "vitest";
import { PRODUCTS_BY_ID } from "@/data/products";
import { generateDesigns } from "@/lib/design-engine";

describe("generateDesigns", () => {
  const areas = [
    { id: "floor-1", type: "floor" as const },
    { id: "wall-1", type: "wall" as const },
    { id: "wall-2", type: "wall" as const },
    { id: "ceiling-1", type: "ceiling" as const },
    { id: "window-1", type: "window" as const },
  ];

  it("generates four designs", () => {
    expect(generateDesigns(areas)).toHaveLength(4);
  });

  it("does not assign a material to windows", () => {
    const designs = generateDesigns(areas);

    for (const design of designs) {
      expect(design.areaProducts["window-1"]).toBeNull();
    }
  });

  it("uses only product IDs that exist in the catalog", () => {
    const designs = generateDesigns(areas);

    for (const design of designs) {
      for (const productId of Object.values(design.areaProducts)) {
        if (productId !== null) {
          expect(PRODUCTS_BY_ID[productId]).toBeDefined();
        }
      }

      for (const productId of design.furnitureProductIds) {
        expect(PRODUCTS_BY_ID[productId]).toBeDefined();
      }

      if (design.curtainProductId) {
        expect(PRODUCTS_BY_ID[design.curtainProductId]).toBeDefined();
      }
    }
  });

  it("returns consistent results for the same input", () => {
    expect(generateDesigns(areas)).toEqual(generateDesigns(areas));
  });
});
