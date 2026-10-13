"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PRODUCTS_BY_ID } from "@/data/products";
import { WALL_ITEM_SLOTS } from "@/lib/config";

export type AreaType = "floor" | "wall" | "ceiling";

/** A point on the photo, as a fraction of its width and height (slightly outside 0..1 is allowed). */
export interface Point {
  x: number;
  y: number;
}

export interface Area {
  id: string;
  type: AreaType;
  points: Point[];
  /** false while the user is still placing points; true once the shape is finished. */
  closed: boolean;
}

export interface FurnitureItem {
  id: string;
  productId: string;
  /** Where the item sits, as a fraction of the photo. */
  x: number;
  y: number;
  /** Width as a fraction of the photo's width. */
  scale: number;
  flipped: boolean;
  /** Degrees. */
  rotation: number;
  /** Wall angle in degrees for wall items. When undefined it is worked out from the item's position. */
  angle?: number;
}

export const MIN_POINTS = 3;
/** How many shapes of each type can be marked. */
export const MAX_AREAS: Record<AreaType, number> = { floor: 1, wall: 4, ceiling: 1 };

export const isComplete = (a: Area) => a.closed;

const NO_PRODUCTS: Record<AreaType, string | null> = { floor: null, wall: null, ceiling: null };

export function usePhotoDesign() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  /** One product per area type, so every wall gets the same product (matches the bill). */
  const [products, setProducts] = useState(NO_PRODUCTS);
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<AreaType>("floor");

  // Plain counters: crypto.randomUUID() is missing on http:// pages (e.g. testing on a phone by IP).
  const areaCounter = useRef(0);
  const furnitureCounter = useRef(0);
  const newAreaId = () => `area-${++areaCounter.current}`;

  const clearAll = useCallback(() => {
    setPhotoUrl(null);
    setAreas([]);
    setProducts(NO_PRODUCTS);
    setFurniture([]);
    setSelectedFurnitureId(null);
    setActiveAreaId(null);
    setActiveType("floor");
  }, []);

  /** A new photo has different geometry, so earlier marks and furniture are dropped. */
  const setPhoto = useCallback((url: string) => {
    setPhotoUrl(url);
    setAreas([]);
    setFurniture([]);
    setSelectedFurnitureId(null);
    setActiveAreaId(null);
  }, []);

  // ===== AREAS =====

  /**
   * Adds a point to the shape being drawn for the active type, or starts a new shape.
   * Returns false when nothing could be added (the type is at its limit), so the UI can say why.
   */
  const addPoint = useCallback(
    (p: Point): boolean => {
      const open = areas.find((a) => a.type === activeType && !a.closed);
      if (open) {
        setAreas((as) => as.map((a) => (a.id === open.id ? { ...a, points: [...a.points, p] } : a)));
        setActiveAreaId(open.id);
        return true;
      }
      if (areas.filter((a) => a.type === activeType).length >= MAX_AREAS[activeType]) return false;
      const id = newAreaId();
      setAreas((as) => [...as, { id, type: activeType, points: [p], closed: false }]);
      setActiveAreaId(id);
      return true;
    },
    [areas, activeType],
  );

  /** Finishes a shape. Needs at least MIN_POINTS points. */
  const closeArea = useCallback((id: string) => {
    setAreas((as) => as.map((a) => (a.id === id && a.points.length >= MIN_POINTS ? { ...a, closed: true } : a)));
  }, []);

  /** Replaces all points of a shape (used when a whole edge is dragged). */
  const setPoints = useCallback((id: string, points: Point[]) => {
    setAreas((as) => as.map((a) => (a.id === id ? { ...a, points } : a)));
  }, []);

  /** Moves one corner while the user drags it. */
  const movePoint = useCallback((id: string, index: number, p: Point) => {
    setAreas((as) =>
      as.map((a) => (a.id === id ? { ...a, points: a.points.map((q, i) => (i === index ? p : q)) } : a)),
    );
  }, []);

  /** Adds a corner after `index`, on the edge between two corners. */
  const insertPoint = useCallback((id: string, index: number, p: Point) => {
    setAreas((as) =>
      as.map((a) => {
        if (a.id !== id) return a;
        const points = [...a.points];
        points.splice(index + 1, 0, p);
        return { ...a, points };
      }),
    );
  }, []);

  /** Removes a corner. A finished shape keeps at least MIN_POINTS corners. */
  const removePoint = useCallback((id: string, index: number) => {
    setAreas((as) =>
      as.flatMap((a) => {
        if (a.id !== id) return [a];
        if (a.closed && a.points.length <= MIN_POINTS) return [a];
        const points = a.points.filter((_, i) => i !== index);
        return points.length === 0 ? [] : [{ ...a, points }];
      }),
    );
  }, []);

  /** Removes the last corner of the most recent shape of the active type. */
  const undoPoint = useCallback(() => {
    const target = [...areas].reverse().find((a) => a.type === activeType);
    if (!target) return;
    setAreas((as) =>
      as.flatMap((a) => {
        if (a.id !== target.id) return [a];
        const points = a.points.slice(0, -1);
        return points.length === 0 ? [] : [{ ...a, points, closed: a.closed && points.length >= MIN_POINTS }];
      }),
    );
  }, [areas, activeType]);

  const clearType = useCallback((type: AreaType) => {
    setAreas((as) => as.filter((a) => a.type !== type));
    setActiveAreaId(null);
  }, []);

  const removeArea = useCallback((id: string) => {
    setAreas((as) => as.filter((a) => a.id !== id));
    setActiveAreaId((current) => (current === id ? null : current));
  }, []);

  const setProduct = useCallback((type: AreaType, productId: string | null) => {
    setProducts((p) => ({ ...p, [type]: productId }));
  }, []);

  // ===== FURNITURE =====

  const addFurniture = useCallback((productId: string, scale: number) => {
    const id = `item-${++furnitureCounter.current}`;
    const slot = PRODUCTS_BY_ID[productId]?.slot;
    const onWall = !!slot && WALL_ITEM_SLOTS.includes(slot);
    // each new item lands a little to the side of the last one, so they do not pile up exactly
    const nudge = ((furnitureCounter.current % 5) - 2) * 0.07;
    setFurniture((f) => [
      ...f,
      {
        id,
        productId,
        x: Math.min(0.9, Math.max(0.1, 0.5 + nudge)),
        y: onWall ? 0.4 : 0.85, // wall items start on the wall, floor items on the floor
        scale,
        flipped: false,
        rotation: 0,
      },
    ]);
    setSelectedFurnitureId(id);
  }, []);

  const updateFurniture = useCallback((id: string, patch: Partial<FurnitureItem>) => {
    setFurniture((f) => f.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeFurniture = useCallback((id: string) => {
    setFurniture((f) => f.filter((x) => x.id !== id));
    setSelectedFurnitureId((cur) => (cur === id ? null : cur));
  }, []);

  // ===== DERIVED =====

  const canUndo = useMemo(() => areas.some((a) => a.type === activeType), [areas, activeType]);
  const openArea = useMemo(() => areas.find((a) => a.type === activeType && !a.closed), [areas, activeType]);
  const canFinish = !!openArea && openArea.points.length >= MIN_POINTS;
  const finish = useCallback(() => {
    if (openArea) closeArea(openArea.id);
  }, [openArea, closeArea]);

  return {
    photoUrl, setPhoto, removePhoto: clearAll, reset: clearAll,
    areas, addPoint, closeArea, finish, canFinish, setPoints, movePoint, insertPoint, removePoint,
    undoPoint, clearType, removeArea, canUndo,
    products, setProduct,
    activeAreaId, setActiveAreaId, activeType, setActiveType,
    furniture, addFurniture, updateFurniture, removeFurniture,
    selectedFurnitureId, setSelectedFurnitureId,
  };
}