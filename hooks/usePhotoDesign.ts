"use client";

import { useCallback, useRef, useState } from "react";
import { PRODUCTS_BY_ID } from "@/data/products";
import { WALL_ITEM_SLOTS } from "@/lib/config";

export type AreaType = "floor" | "wall" | "ceiling" | "window" | "door";

export interface Point {
  x: number;
  y: number;
}

export interface Area {
  id: string;
  type: AreaType;
  points: Point[];
  holes?: Point[][];
  position?: string | null;
  closed: boolean;
}

export interface SegmentationResponse {
  image_width: number;
  image_height: number;
  areas: {
    label: string;
    position?: string | null;
    polygon: Point[];
    holes?: Point[][];
    valid?: boolean;
  }[];
}

export interface FurnitureItem {
  id: string;
  productId: string;
  x: number;
  y: number;
  scale: number;
  scaleY?: number;
  flipped: boolean;
  rotation: number;
  angle?: number;
}

export interface FurniturePlacementInput {
  x?: number;
  y?: number;
  scaleY?: number;
  angle?: number;
  rotation?: number;
  flipped?: boolean;
}

export function mapSegmentationAreas(response: SegmentationResponse): Area[] {
  if (!Array.isArray(response.areas)) {
    throw new Error("Invalid segmentation response: areas are missing.");
  }

  // First pass: collect all standalone window and door polygons so we can
  // cut them out of overlapping wall/floor polygons automatically.
  const openingHoles: Point[][] = [];
  for (const item of response.areas) {
    const label = item.label?.toLowerCase().trim() ?? "";
    if (
      (label.includes("window") || label.includes("door")) &&
      Array.isArray(item.polygon) &&
      item.polygon.length >= 3
    ) {
      openingHoles.push(item.polygon.map(({ x, y }) => ({ x, y })));
    }
  }

  return response.areas.flatMap((item, index) => {
    const label = item.label?.toLowerCase().trim() ?? "";
    let type: AreaType;

    if (label.includes("floor")) type = "floor";
    else if (label.includes("ceiling")) type = "ceiling";
    else if (label.includes("wall")) type = "wall";
    else if (label.includes("window")) type = "window";
    else if (label.includes("door")) type = "door";
    else return [];

    if (!Array.isArray(item.polygon) || item.polygon.length < 3) {
      return [];
    }

    const baseHoles = (item.holes ?? []).map((hole) =>
      hole.map(({ x, y }) => ({ x, y }))
    );

    // Ensure walls and floors never paint over detected doors or windows
    const mergedHoles =
      type === "wall" || type === "floor"
        ? [...baseHoles, ...openingHoles]
        : baseHoles;

    return [
      {
        id: `ai-${type}-${index}`,
        type,
        position: item.position ?? null,
        points: item.polygon.map(({ x, y }) => ({ x, y })),
        holes: mergedHoles,
        closed: true,
      },
    ];
  });
}

export function usePhotoDesign() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [products, setProducts] = useState<Record<string, string | null>>({});
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

  const furnitureCounter = useRef(0);

  const clearAll = useCallback(() => {
    setPhotoUrl(null);
    setAreas([]);
    setProducts({});
    setFurniture([]);
    setSelectedFurnitureId(null);
  }, []);

  const setPhoto = useCallback((url: string) => {
    setPhotoUrl(url);
    setAreas([]);
    setProducts({});
    setFurniture([]);
    setSelectedFurnitureId(null);
  }, []);

  const importSegmentation = useCallback((response: SegmentationResponse) => {
    const detectedAreas = mapSegmentationAreas(response);
    if (detectedAreas.length === 0) {
      throw new Error("No usable wall, floor, or ceiling polygons were detected.");
    }
    setAreas(detectedAreas);
  }, []);

  const removeArea = useCallback((id: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setProduct = useCallback((areaId: string, productId: string | null) => {
    setProducts((prev) => ({
      ...prev,
      [areaId]: productId,
    }));
  }, []);

  const addFurniture = useCallback(
    (productId: string, scale: number, options?: FurniturePlacementInput) => {
      const id = `item-${++furnitureCounter.current}`;
      const product = PRODUCTS_BY_ID[productId];
      const slot = product?.slot;
      const onWall = !!slot && WALL_ITEM_SLOTS.includes(slot);

      const defaultPositions: Record<string, { x: number; y: number }> = {
        sofa: { x: 0.5, y: 0.78 },
        table: { x: 0.5, y: 0.9 },
        joinery: { x: 0.5, y: 0.42 },
        curtain: { x: 0.2, y: 0.2 },
      };

      const fallback = slot
        ? defaultPositions[slot] ?? { x: 0.5, y: onWall ? 0.4 : 0.78 }
        : { x: 0.5, y: 0.78 };

      const x = options?.x ?? fallback.x;
      const y = options?.y ?? fallback.y;

      setFurniture((current) => [
        ...current,
        {
          id,
          productId,
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          scale,
          ...(options?.scaleY != null ? { scaleY: options.scaleY } : {}),
          flipped: options?.flipped ?? false,
          rotation: options?.rotation ?? 0,
          ...(options?.angle != null ? { angle: options.angle } : {}),
        },
      ]);

      setSelectedFurnitureId(id);
    },
    []
  );

  const updateFurniture = useCallback((id: string, patch: Partial<FurnitureItem>) => {
    setFurniture((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const removeFurniture = useCallback((id: string) => {
    setFurniture((prev) => prev.filter((item) => item.id !== id));
    setSelectedFurnitureId((current) => (current === id ? null : current));
  }, []);

  const clearFurniture = useCallback((id?: string) => {
    if (id) {
      setFurniture((prev) => prev.filter((item) => item.id !== id));
      setSelectedFurnitureId((current) => (current === id ? null : current));
      return;
    }
    setFurniture([]);
    setSelectedFurnitureId(null);
  }, []);

  return {
    photoUrl,
    setPhoto,
    removePhoto: clearAll,
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
  };
}