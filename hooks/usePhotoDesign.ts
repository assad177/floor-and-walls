
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PRODUCTS_BY_ID } from "@/data/products";
import { WALL_ITEM_SLOTS } from "@/lib/config";

export type AreaType = "floor" | "wall" | "ceiling" | "window";

/** A normalized point on the photo. */
export interface Point {
  x: number;
  y: number;
}

export interface Area {
  id: string;
  type: AreaType;
  points: Point[];
  closed: boolean;
}

export interface SegmentationResponse {
  image_width: number;
  image_height: number;
  areas: {
    label: string;
    position?: string;
    polygon: Point[];
  }[];
}

/** Convert backend segmentation results into frontend areas. */
export function mapSegmentationAreas(
  response: SegmentationResponse
): Area[] {
  if (!Array.isArray(response.areas)) {
    throw new Error("Invalid segmentation response: areas are missing.");
  }

  return response.areas.flatMap((item, index) => {
    const label = item.label?.toLowerCase().trim() ?? "";

    let type: AreaType;

   if (label.includes("floor")) {
  type = "floor";
} else if (label.includes("ceiling")) {
  type = "ceiling";
} else if (label.includes("wall")) {
  type = "wall";
} else if (label.includes("window")) {
  type = "window";
} else {
  return [];
}

    if (
      !Array.isArray(item.polygon) ||
      item.polygon.length < 3
    ) {
      return [];
    }

    return [
      {
        id: `ai-${type}-${index}`,
        type,
        // Backend coordinates are already normalized (0–1).
        points: item.polygon.map(({ x, y }) => ({ x, y })),
        closed: true,
      },
    ];
  });
}

export interface FurnitureItem {
  id: string;
  productId: string;
  x: number;
  y: number;
  scale: number;
  flipped: boolean;
  rotation: number;
  angle?: number;
}

export const MIN_POINTS = 3;

export const MAX_AREAS: Record<AreaType, number> = {
  floor: 1,
  wall: 4,
  ceiling: 1,
  window:5
};

export const isComplete = (a: Area) => a.closed;



export function usePhotoDesign() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [products, setProducts] = useState<
  Record<string, string | null>
>({});
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedFurnitureId, setSelectedFurnitureId] =
    useState<string | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<AreaType>("floor");

  const areaCounter = useRef(0);
  const furnitureCounter = useRef(0);

  const newAreaId = () => `area-${++areaCounter.current}`;

  const clearAll = useCallback(() => {
    setPhotoUrl(null);
    setAreas([]);
   setProducts({});
    setFurniture([]);
    setSelectedFurnitureId(null);
    setActiveAreaId(null);
    setActiveType("floor");
  }, []);

  /** Reset geometry when a new photo is selected. */
  const setPhoto = useCallback((url: string) => {
  setPhotoUrl(url);
  setAreas([]);
  setProducts({});
  setFurniture([]);
  setSelectedFurnitureId(null);
  setActiveAreaId(null);
  setActiveType("floor");
}, []);

  // ===== AI SEGMENTATION =====

  /**
   * Import the polygons returned by the backend.
   * AI areas can exceed MAX_AREAS because they are imported directly,
   * rather than added one-by-one through the manual drawing tool.
   */
  const importSegmentation = useCallback(
    (response: SegmentationResponse) => {
      const detectedAreas = mapSegmentationAreas(response);

      if (detectedAreas.length === 0) {
        throw new Error(
          "No usable wall, floor, or ceiling polygons were detected."
        );
      }

      setAreas(detectedAreas);
      setActiveAreaId(null);
      setActiveType("wall");
    },
    []
  );

  // ===== MANUAL AREAS =====

  const addPoint = useCallback(
    (p: Point): boolean => {
      const open = areas.find(
        (a) => a.type === activeType && !a.closed
      );

      if (open) {
        setAreas((as) =>
          as.map((a) =>
            a.id === open.id
              ? { ...a, points: [...a.points, p] }
              : a
          )
        );
        setActiveAreaId(open.id);
        return true;
      }

      if (
        areas.filter((a) => a.type === activeType).length >=
        MAX_AREAS[activeType]
      ) {
        return false;
      }

      const id = newAreaId();

      setAreas((as) => [
        ...as,
        { id, type: activeType, points: [p], closed: false },
      ]);

      setActiveAreaId(id);
      return true;
    },
    [areas, activeType]
  );

  const closeArea = useCallback((id: string) => {
    setAreas((as) =>
      as.map((a) =>
        a.id === id && a.points.length >= MIN_POINTS
          ? { ...a, closed: true }
          : a
      )
    );
  }, []);

  const setPoints = useCallback(
    (id: string, points: Point[]) => {
      setAreas((as) =>
        as.map((a) => (a.id === id ? { ...a, points } : a))
      );
    },
    []
  );

  const movePoint = useCallback(
    (id: string, index: number, p: Point) => {
      setAreas((as) =>
        as.map((a) =>
          a.id === id
            ? {
                ...a,
                points: a.points.map((q, i) =>
                  i === index ? p : q
                ),
              }
            : a
        )
      );
    },
    []
  );

  const insertPoint = useCallback(
    (id: string, index: number, p: Point) => {
      setAreas((as) =>
        as.map((a) => {
          if (a.id !== id) return a;

          const points = [...a.points];
          points.splice(index + 1, 0, p);

          return { ...a, points };
        })
      );
    },
    []
  );

  const removePoint = useCallback(
    (id: string, index: number) => {
      setAreas((as) =>
        as.flatMap((a) => {
          if (a.id !== id) return [a];

          if (a.closed && a.points.length <= MIN_POINTS) {
            return [a];
          }

          const points = a.points.filter((_, i) => i !== index);

          return points.length === 0
            ? []
            : [{ ...a, points }];
        })
      );
    },
    []
  );

  const undoPoint = useCallback(() => {
    const target = [...areas]
      .reverse()
      .find((a) => a.type === activeType);

    if (!target) return;

    setAreas((as) =>
      as.flatMap((a) => {
        if (a.id !== target.id) return [a];

        const points = a.points.slice(0, -1);

        return points.length === 0
          ? []
          : [
              {
                ...a,
                points,
                closed:
                  a.closed && points.length >= MIN_POINTS,
              },
            ];
      })
    );
  }, [areas, activeType]);

  const clearType = useCallback((type: AreaType) => {
    setAreas((as) => as.filter((a) => a.type !== type));
    setActiveAreaId(null);
  }, []);

  const removeArea = useCallback((id: string) => {
    setAreas((as) => as.filter((a) => a.id !== id));

    setActiveAreaId((current) =>
      current === id ? null : current
    );
  }, []);

 const setProduct = (areaId: string, productId: string | null) => {
  setProducts((prev) => ({
    ...prev,
    [areaId]: productId,
  }));
};

  // ===== FURNITURE =====

  const addFurniture = useCallback(
  (productId: string, scale: number) => {
    const id = `item-${++furnitureCounter.current}`;
    const product = PRODUCTS_BY_ID[productId];
    const slot = product?.slot;
    const onWall = !!slot && WALL_ITEM_SLOTS.includes(slot);

    // Default positions use normalized canvas coordinates (0 to 1).
    const positions: Record<string, { x: number; y: number }> = {
      sofa: { x: 0.5, y: 0.78 },
      table: { x: 0.5, y: 0.9 },
      joinery: { x: 0.5, y: 0.42 },
      curtain: { x: 0.2, y: 0.4 },
    };

    const defaultPosition = slot
      ? positions[slot] ?? { x: 0.5, y: onWall ? 0.4 : 0.78 }
      : { x: 0.5, y: 0.78 };

    // Small offsets prevent repeated items from stacking exactly.
    const index = furnitureCounter.current - 1;
    const column = index % 3;
    const row = Math.floor(index / 3) % 3;

    const x = Math.min(
      0.9,
      Math.max(0.1, defaultPosition.x + (column - 1) * 0.08)
    );

    const y = Math.min(
      0.92,
      Math.max(0.08, defaultPosition.y + row * 0.035)
    );

    setFurniture((current) => [
      ...current,
      {
        id,
        productId,
        x,
        y,
        scale,
        flipped: false,
        rotation: 0,
      },
    ]);

    setSelectedFurnitureId(id);
  },
  []
);
  const updateFurniture = useCallback(
    (id: string, patch: Partial<FurnitureItem>) => {
      setFurniture((f) =>
        f.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        )
      );
    },
    []
  );

  const removeFurniture = useCallback((id: string) => {
    setFurniture((f) => f.filter((x) => x.id !== id));

    setSelectedFurnitureId((current) =>
      current === id ? null : current
    );
  }, []);

  // ===== DERIVED VALUES =====

  const canUndo = useMemo(
    () => areas.some((a) => a.type === activeType),
    [areas, activeType]
  );

  const openArea = useMemo(
    () => areas.find(
      (a) => a.type === activeType && !a.closed
    ),
    [areas, activeType]
  );

  const canFinish =
    !!openArea && openArea.points.length >= MIN_POINTS;

  const finish = useCallback(() => {
    if (openArea) closeArea(openArea.id);
  }, [openArea, closeArea]);

  return {
    photoUrl,
    setPhoto,
    removePhoto: clearAll,
    reset: clearAll,

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

    activeAreaId,
    setActiveAreaId,
    activeType,
    setActiveType,

    furniture,
    addFurniture,
    updateFurniture,
    removeFurniture,
    selectedFurnitureId,
    setSelectedFurnitureId,

    importSegmentation,
  };
}
