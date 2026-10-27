import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PRODUCTS, PRODUCTS_BY_ID } from "@/data/products";
import { getProductDimensionsM, ROOM_REFERENCE_METERS } from "@/lib/config";

export const maxDuration = 60;
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20_000,
  maxRetries: 1,
});

type Pt = { x: number; y: number };

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface PlacementItem {
  id: string;
  slot: string;
  productId: string;
  x: number;
  y: number;
  scale: number;
  scaleY?: number;   // <-- NAYA: Independent height control
  rotation: number;
  angle?: number;    // <-- 3D Perspective ke liye
  flipped?: boolean;
}

const ALL_SLOTS = [
  "floor",
  "wall",
  "ceiling",
  "joinery",
  "sofa",
  "table",
  "curtain",
] as const;

// ── Math & Geometry Utilities ─────────────────────────────────────────────────

function num(val: unknown, fallback: number): number {
  return typeof val === "number" && Number.isFinite(val) ? val : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function parseBBox(bbox: any, fb: BBox): BBox {
  if (!bbox) return fb;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    return {
      minX: num(bbox[0], fb.minX),
      minY: num(bbox[1], fb.minY),
      maxX: num(bbox[2], fb.maxX),
      maxY: num(bbox[3], fb.maxY),
    };
  }
  return {
    minX: num(bbox.min_x ?? bbox.minX, fb.minX),
    minY: num(bbox.min_y ?? bbox.minY, fb.minY),
    maxX: num(bbox.max_x ?? bbox.maxX, fb.maxX),
    maxY: num(bbox.max_y ?? bbox.maxY, fb.maxY),
  };
}

function polyBBox(
  poly: Pt[],
  fb: BBox = { minX: 0.08, minY: 0.56, maxX: 0.92, maxY: 0.98 }
): BBox {
  if (!poly || poly.length < 3) return fb;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY };
}

function boxesOverlap(a: BBox, b: BBox, padX = 0, padY = 0): boolean {
  return !(
    a.maxX + padX < b.minX ||
    a.minX - padX > b.maxX ||
    a.maxY + padY < b.minY ||
    a.minY - padY > b.maxY
  );
}

function polygonSpanAtY(
  poly: Pt[],
  y: number
): { minX: number; maxX: number; width: number } | null {
  if (!poly || poly.length < 3) return null;
  let minX = Infinity;
  let maxX = -Infinity;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const dy = p2.y - p1.y;
    if (Math.abs(dy) < 1e-9) continue;
    const t = (y - p1.y) / dy;
    if (t < 0 || t > 1) continue;
    const x = p1.x + t * (p2.x - p1.x);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }

  if (maxX <= minX) return null;
  return { minX, maxX, width: maxX - minX };
}

function polygonSpanAtX(
  poly: Pt[],
  x: number
): { minY: number; maxY: number } | null {
  if (!poly || poly.length < 3) return null;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const dx = p2.x - p1.x;
    if (Math.abs(dx) < 1e-9) continue;
    const t = (x - p1.x) / dx;
    if (t < 0 || t > 1) continue;
    const y = p1.y + t * (p2.y - p1.y);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (maxY <= minY) return null;
  return { minY, maxY };
}

function calibrateRoomWidthMeters(
  floorBox: BBox,
  walls: any[],
  openings: BBox[]
): number {
  const baseWidth = ROOM_REFERENCE_METERS.standardRoomWidth ?? 4.2;
  const ceilingH = ROOM_REFERENCE_METERS.standardCeilingHeight ?? 2.55;

  let wallHeightNorm = 0.36;
  for (const w of walls) {
    const span = polygonSpanAtX(w.polygon ?? [], 0.5);
    if (span && span.maxY - span.minY > 0.15) {
      wallHeightNorm = Math.max(wallHeightNorm, span.maxY - span.minY);
    }
  }

  const floorWidthNorm = Math.max(0.4, floorBox.maxX - floorBox.minX);
  const estimatedMeters = (floorWidthNorm / wallHeightNorm) * ceilingH * 0.68;

  if (openings.length > 0) {
    return clamp((estimatedMeters + baseWidth) / 2, 3.4, 5.6);
  }
  return clamp(estimatedMeters, 3.5, 5.4);
}

function fitFootprintToFloor(
  floorPoly: Pt[],
  floorBox: BBox,
  targetX: number,
  targetY: number,
  scale: number,
  minWallClearanceY = 0.08
): { x: number; y: number; scale: number } {
  const floorDepth = Math.max(0.10, floorBox.maxY - floorBox.minY);
  let y = clamp(targetY, floorBox.minY + minWallClearanceY, floorBox.maxY - 0.04);
  let x = targetX;

  for (let iter = 0; iter < 4; iter++) {
    const hSpan = polygonSpanAtY(floorPoly, y);
    if (hSpan) {
      const wallMarginX = Math.min(0.065, hSpan.width * 0.10);
      const safeMinX = hSpan.minX + wallMarginX + scale / 2;
      const safeMaxX = hSpan.maxX - wallMarginX - scale / 2;

      if (safeMaxX > safeMinX) {
        x = clamp(x, safeMinX, safeMaxX);
      } else {
        x = (hSpan.minX + hSpan.maxX) / 2;
        scale = clamp(hSpan.width * 0.64, 0.10, scale);
      }
    }

    const sampleFractions = [-0.48, -0.32, -0.16, 0, 0.16, 0.32, 0.48];
    let highestFloorCreaseY = floorBox.minY;

    for (const frac of sampleFractions) {
      const sx = x + scale * frac;
      const vSpan = polygonSpanAtX(floorPoly, sx);
      if (vSpan) {
        highestFloorCreaseY = Math.max(highestFloorCreaseY, vSpan.minY);
      }
    }

    const requiredY =
      highestFloorCreaseY + Math.max(minWallClearanceY, floorDepth * 0.17);
    if (y < requiredY) {
      y = Math.min(floorBox.maxY - 0.04, requiredY);
    }
  }

  return { x: +x.toFixed(4), y: +y.toFixed(4), scale: +scale.toFixed(4) };
}

function computeMetricScaleOnFloor(
  productId: string,
  slot: string,
  y: number,
  floorPoly: Pt[],
  floorBox: BBox,
  roomWidthMeters: number
): number {
  const dims = getProductDimensionsM(productId, slot);
  const span = polygonSpanAtY(floorPoly, y);
  const visibleFloorWidthNorm = span ? span.width : floorBox.maxX - floorBox.minX;

  const depthProgress = clamp(
    (y - floorBox.minY) / Math.max(0.08, floorBox.maxY - floorBox.minY),
    0,
    1
  );
  const perspectiveBoost = 0.86 + depthProgress * 0.30;

  const rawScale =
    (dims.width / roomWidthMeters) * visibleFloorWidthNorm * perspectiveBoost;

  if (slot === "table") return clamp(rawScale, 0.11, 0.21);
  if (slot === "sofa") {
    const isCompactSeating = dims.width < 1.15;
    return isCompactSeating
      ? clamp(rawScale, 0.12, 0.20)
      : clamp(rawScale, 0.24, 0.37);
  }
  return clamp(rawScale, 0.10, 0.35);
}

function estimateWallAngleAtX(poly: Pt[], x: number, spanDx = 0.08): { angle: number; slope: number } {
  const leftSpan = polygonSpanAtX(poly, Math.max(0.02, x - spanDx));
  const rightSpan = polygonSpanAtX(poly, Math.min(0.98, x + spanDx));
  if (!leftSpan || !rightSpan) {
    return { angle: x < 0.32 ? 16 : x > 0.68 ? -16 : 0, slope: 0 };
  }

  const bottomSlope = (rightSpan.maxY - leftSpan.maxY) / (2 * spanDx);
  const topSlope = (rightSpan.minY - leftSpan.minY) / (2 * spanDx);
  const perspectiveCue = topSlope - bottomSlope;

  if (perspectiveCue > 0.14 || (x < 0.34 && bottomSlope < -0.08)) {
    const computed = clamp(Math.round(Math.abs(perspectiveCue) * 55), 15, 25);
    return { angle: computed, slope: Math.abs(perspectiveCue) };
  }
  if (perspectiveCue < -0.14 || (x > 0.66 && bottomSlope > 0.08)) {
    const computed = -clamp(Math.round(Math.abs(perspectiveCue) * 55), 15, 25);
    return { angle: computed, slope: Math.abs(perspectiveCue) };
  }

  return { angle: 0, slope: Math.abs(perspectiveCue) };
}

function findBestWallPlacement(
  walls: any[],
  openings: BBox[],
  preferredSide: "auto" | "back" | "right" | "left",
  joineryId: string
): { x: number; y: number; scale: number; angle: number } {
  const dims = getProductDimensionsM(joineryId, "joinery");
  const ceilingH = ROOM_REFERENCE_METERS.standardCeilingHeight ?? 2.55;

  type CandidateWall = {
    x: number;
    y: number;
    scale: number;
    angle: number;
    score: number;
  };
  const candidates: CandidateWall[] = [];

  for (const wall of walls) {
    const poly: Pt[] = wall.polygon ?? [];
    if (poly.length < 3) continue;

    const box = parseBBox(wall.bbox, polyBBox(poly));
    const pos = String(wall.position ?? "back").toLowerCase();

    const wallHoleBoxes: BBox[] = Array.isArray(wall.holes)
      ? wall.holes
          .filter((h: Pt[]) => Array.isArray(h) && h.length >= 3)
          .map((h: Pt[]) => polyBBox(h))
      : [];
    const allObstacles = [...openings, ...wallHoleBoxes];

    const sampleFractions = [0.16, 0.24, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82];
    for (const fx of sampleFractions) {
      const cx = box.minX + (box.maxX - box.minX) * fx;
      const vSpan = polygonSpanAtX(poly, cx);
      if (!vSpan) continue;

      const wallHeightAtX = vSpan.maxY - vSpan.minY;
      if (wallHeightAtX < 0.16) continue;

      const cy = vSpan.minY + wallHeightAtX * 0.46;
      const scale = clamp(
        wallHeightAtX * (dims.width / ceilingH) * 0.60,
        0.13,
        0.22
      );

      const leftSpan = polygonSpanAtX(poly, cx - scale * 0.48);
      const rightSpan = polygonSpanAtX(poly, cx + scale * 0.48);
      if (!leftSpan || !rightSpan) continue;

      const itemBox: BBox = {
        minX: cx - scale / 2,
        maxX: cx + scale / 2,
        minY: cy - scale * 0.38,
        maxY: cy + scale * 0.38,
      };

      const hitsObstacle = allObstacles.some((obs) =>
        boxesOverlap(itemBox, obs, 0.04, 0.03)
      );
      if (hitsObstacle) continue;

      const { angle, slope } = estimateWallAngleAtX(poly, cx, scale * 0.5);
      const flatnessBonus = slope < 0.12 ? 0.55 : -slope * 0.4;
      let score = wallHeightAtX * 2.2 + (box.maxX - box.minX) * 1.1 + flatnessBonus;

      if (preferredSide === "left" && cx < 0.45) score += 0.35;
      else if (preferredSide === "right" && cx > 0.55) score += 0.35;
      else if (preferredSide === "back" && cx >= 0.35 && cx <= 0.70) score += 0.45;

      score -= Math.abs(fx - 0.52) * 0.25;

      candidates.push({
        x: +cx.toFixed(4),
        y: +cy.toFixed(4),
        scale: +scale.toFixed(4),
        angle,
        score,
      });
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  return { x: 0.60, y: 0.42, scale: 0.16, angle: 0 };
}
function buildLayoutForVariant(
  analyzedAreas: any[],
  themeProducts: Record<string, string | null>,
  variantIdx: number,
  aiHint?: {
    sofaXFrac?: number;
    sofaDepthFrac?: number;
    tableOffsetX?: number;
    wallPref?: "auto" | "back" | "right" | "left";
  }
): PlacementItem[] {
  const floors = analyzedAreas.filter((a) =>
    String(a.label ?? "").toLowerCase().includes("floor")
  );
  const walls = analyzedAreas.filter((a) =>
    String(a.label ?? "").toLowerCase().includes("wall")
  );
  const windows = analyzedAreas.filter((a) =>
    String(a.label ?? "").toLowerCase().includes("window")
  );
  const doors = analyzedAreas.filter((a) =>
    String(a.label ?? "").toLowerCase().includes("door")
  );

  const embeddedWindowHoles: BBox[] = [];
  for (const w of walls) {
    if (Array.isArray(w.holes)) {
      for (const holePoly of w.holes) {
        if (Array.isArray(holePoly) && holePoly.length >= 3) {
          embeddedWindowHoles.push(polyBBox(holePoly));
        }
      }
    }
  }

  const floorArea = floors.sort(
    (a, b) => (b.area_ratio ?? 0) - (a.area_ratio ?? 0)
  )[0];
  const floorPoly: Pt[] = floorArea?.polygon ?? [];
  const floorBox = parseBBox(
    floorArea?.bbox,
    polyBBox(floorPoly, { minX: 0.05, minY: 0.58, maxX: 0.95, maxY: 0.98 })
  );

  const rawWindowBoxes = windows.map((w) =>
    parseBBox(
      w.bbox,
      polyBBox(w.polygon ?? [], { minX: 0.38, minY: 0.25, maxX: 0.58, maxY: 0.58 })
    )
  );
  const windowBoxes =
    rawWindowBoxes.length > 0 ? rawWindowBoxes : embeddedWindowHoles;

  const doorBoxes = doors.map((d) =>
    parseBBox(
      d.bbox,
      polyBBox(d.polygon ?? [], { minX: 0.62, minY: 0.30, maxX: 0.72, maxY: 0.65 })
    )
  );
  const allOpenings = [...windowBoxes, ...doorBoxes];

  const roomWidthMeters = calibrateRoomWidthMeters(floorBox, walls, allOpenings);

  const defaultStrategies = [
    { sofaXFrac: 0.50, sofaDepthFrac: 0.36, tableOffsetX: 0.0, tableDepthDelta: 0.16, wallPref: "right" as const },
    { sofaXFrac: 0.56, sofaDepthFrac: 0.37, tableOffsetX: -0.11, tableDepthDelta: 0.15, wallPref: "left" as const },
    { sofaXFrac: 0.44, sofaDepthFrac: 0.36, tableOffsetX: 0.11, tableDepthDelta: 0.15, wallPref: "right" as const },
    { sofaXFrac: 0.52, sofaDepthFrac: 0.41, tableOffsetX: -0.07, tableDepthDelta: 0.15, wallPref: "auto" as const },
  ];
  const baseStrat = defaultStrategies[variantIdx % defaultStrategies.length];

  const strat = {
    sofaXFrac: clamp(num(aiHint?.sofaXFrac, baseStrat.sofaXFrac), 0.35, 0.65),
    sofaDepthFrac: clamp(num(aiHint?.sofaDepthFrac, baseStrat.sofaDepthFrac), 0.30, 0.50),
    tableOffsetX: clamp(num(aiHint?.tableOffsetX, baseStrat.tableOffsetX), -0.18, 0.18),
    tableDepthDelta: baseStrat.tableDepthDelta,
    wallPref: aiHint?.wallPref ?? baseStrat.wallPref,
  };

  const placements: PlacementItem[] = [];

 // ── 1. WINDOW DRESSINGS / CURTAINS ─────────────────────────────────────────
const primaryWallPoly: Pt[] = walls[0]?.polygon ?? [];
  const curtainId = themeProducts.curtain;

  if (curtainId && windowBoxes.length > 0) {
    windowBoxes.forEach((wb, wIdx) => {
      const winW = Math.max(0.05, wb.maxX - wb.minX);
      const winH = Math.max(0.08, wb.maxY - wb.minY);
      const winCenterX = (wb.minX + wb.maxX) / 2;

      const rodOffset = Math.min(0.03, winH * 0.08);
      const topRodY = Math.max(0.01, wb.minY - rodOffset);

      const curtainWidth = Math.min(0.9, winW * 1.18);
      const bottomEdgeY = Math.min(0.92, wb.maxY + winH * 0.08);
      const curtainHeight = Math.max(winH, bottomEdgeY - topRodY);

      const { angle } =
        primaryWallPoly.length >= 3
          ? estimateWallAngleAtX(primaryWallPoly, winCenterX, winW * 0.5)
          : { angle: winCenterX < 0.32 ? 16 : winCenterX > 0.68 ? -16 : 0 };

      placements.push({
        id: `design-${variantIdx + 1}-curtain-${wIdx}`,
        slot: "curtain",
        productId: curtainId,
        x: +winCenterX.toFixed(4),
        y: +topRodY.toFixed(4),
        scale: +curtainWidth.toFixed(4),
        scaleY: +curtainHeight.toFixed(4),
        rotation: 0,
        angle,
      });
    });
  }
  // 2. CUSTOM JOINERY / TV MEDIA WALL
  const joineryId = themeProducts.joinery;
  if (joineryId && walls.length > 0) {
    const tvSpot = findBestWallPlacement(
      walls,
      allOpenings,
      strat.wallPref,
      joineryId
    );
    placements.push({
      id: `design-${variantIdx + 1}-joinery`,
      slot: "joinery",
      productId: joineryId,
      x: tvSpot.x,
      y: tvSpot.y,
      scale: tvSpot.scale,
      rotation: 0,
      angle: tvSpot.angle,
    });
  }

  // 3. PRIMARY SEATING (SOFA / ARMCHAIR)
  const sofaId = themeProducts.sofa;
  let finalSofa = { x: 0.50, y: 0.74, scale: 0.26 };

  if (sofaId) {
    const floorDepth = Math.max(0.10, floorBox.maxY - floorBox.minY);
    const rawSofaY = floorBox.minY + floorDepth * strat.sofaDepthFrac;
    const rawSofaX =
      floorBox.minX + (floorBox.maxX - floorBox.minX) * strat.sofaXFrac;

    const metricSofaScale = computeMetricScaleOnFloor(
      sofaId,
      "sofa",
      rawSofaY,
      floorPoly,
      floorBox,
      roomWidthMeters
    );

    finalSofa = fitFootprintToFloor(
      floorPoly,
      floorBox,
      rawSofaX,
      rawSofaY,
      metricSofaScale,
      0.075
    );

    placements.push({
      id: `design-${variantIdx + 1}-sofa`,
      slot: "sofa",
      productId: sofaId,
      x: finalSofa.x,
      y: finalSofa.y,
      scale: finalSofa.scale,
      rotation: 0,
    });
  }

  // 4. COFFEE / NESTING TABLE
  const tableId = themeProducts.table;
  if (tableId) {
    const floorDepth = Math.max(0.10, floorBox.maxY - floorBox.minY);
    const rawTableY = Math.min(
      floorBox.maxY - 0.045,
      finalSofa.y + Math.max(0.065, floorDepth * strat.tableDepthDelta)
    );
    const rawTableX = clamp(
      finalSofa.x + strat.tableOffsetX,
      floorBox.minX + 0.15,
      floorBox.maxX - 0.15
    );

    const metricTableScale = computeMetricScaleOnFloor(
      tableId,
      "table",
      rawTableY,
      floorPoly,
      floorBox,
      roomWidthMeters
    );

    const finalTable = fitFootprintToFloor(
      floorPoly,
      floorBox,
      rawTableX,
      rawTableY,
      metricTableScale,
      0.05
    );

    placements.push({
      id: `design-${variantIdx + 1}-table`,
      slot: "table",
      productId: tableId,
      x: finalTable.x,
      y: finalTable.y,
      scale: finalTable.scale,
      rotation: 0,
    });
  }

  return placements;
}

/**
 * 100% Dynamic Catalog Generator (Zero Hardcoded Product IDs!)
 * Rotates through whatever products currently exist in `data/products.ts`.
 */
function buildDynamicCatalogDesigns(
  productsBySlot: Record<string, string[]>,
  count = 4
) {
  const styleNames = [
    "Bespoke Concept I",
    "Architectural Harmony II",
    "Curated Contrast III",
    "Signature Atelier IV",
  ];

  return Array.from({ length: count }, (_, idx) => {
    const picked: Record<string, string | null> = {};
    for (const slot of ALL_SLOTS) {
      const list = productsBySlot[slot] ?? [];
      // For sofa slot, prefer actual sofas over small decor items like 'plant' as primary seating
      const filteredList =
        slot === "sofa" && list.length > 1
          ? list.filter((id) => id !== "plant")
          : list;
      const pool = filteredList.length > 0 ? filteredList : list;
      picked[slot] = pool.length > 0 ? pool[idx % pool.length] : null;
    }

    const floorName = PRODUCTS_BY_ID[picked.floor ?? ""]?.name ?? "custom flooring";
    const wallName = PRODUCTS_BY_ID[picked.wall ?? ""]?.name ?? "designer walls";
    const sofaName = PRODUCTS_BY_ID[picked.sofa ?? ""]?.name ?? "statement seating";

    return {
      id: `design-${idx + 1}`,
      name: styleNames[idx % styleNames.length],
      blurb: `Featuring ${floorName} paired with ${wallName} and ${sofaName}.`,
      products: picked,
    };
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { segmentation, roomAnalysis, preferredTheme } = body;

    const analyzedAreas: any[] =
      Array.isArray(roomAnalysis?.areas) && roomAnalysis.areas.length > 0
        ? roomAnalysis.areas
        : segmentation?.areas ?? [];

    if (analyzedAreas.length === 0) {
      return NextResponse.json(
        { error: "No room geometry found in segmentation data." },
        { status: 400 }
      );
    }

    const allowed = new Set(PRODUCTS.map((p) => p.id));
    const productsBySlot: Record<string, string[]> = {};
    PRODUCTS.forEach((p) => {
      if (!productsBySlot[p.slot]) productsBySlot[p.slot] = [];
      productsBySlot[p.slot].push(p.id);
    });

    const hasWindow = analyzedAreas.some(
      (a: any) =>
        String(a.label ?? "").toLowerCase().includes("window") ||
        (Array.isArray(a.holes) && a.holes.length > 0)
    );

    // Summarize room geometry + metric product dimensions for OpenAI
    const roomGeometrySummary = analyzedAreas.map((a: any) => ({
      label: a.label,
      position: a.position ?? null,
      bbox: polyBBox(a.polygon ?? []),
      hasWindowCutout: Array.isArray(a.holes) && a.holes.length > 0,
    }));

    const catalogueWithDimensions = PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      slot: p.slot,
      color: p.color,
      pattern: p.pattern ?? "solid",
      price: p.price,
      unit: p.unit,
      dimensionsMeters: getProductDimensionsM(p.id, p.slot),
    }));

    // Dynamic fallback built strictly from live `PRODUCTS` array (zero hardcoded IDs)
    let rawThemes: any[] = buildDynamicCatalogDesigns(productsBySlot, 4);

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an elite AI spatial & interior designer for 'Floors & Walls'.
You are given:
1. Live product catalogue from products.ts (including new floors, wall paints/panels, ceilings, joinery, sofas, tables, curtains, and metric dimensions).
2. Detected room geometry (polygons bounding boxes for walls, floor, ceiling, windows).

Your job:
- Create 4 COMPLETELY DIFFERENT, high-end interior design concepts that actively showcase the full variety of products in the catalogue (including walnut/slate/carpet/oak floors, terracotta/charcoal/greige/wood-panel/sage/navy walls, coffered/wood-slat/navy/white ceilings, etc.).
- DO NOT repeat the same floor, wall, or ceiling across all 4 designs! Every design must use a distinct combination from the live catalogue.
- For each design, also provide spatial layout hints ('layoutHint') tailored to the room geometry and product dimensions.

Return ONLY valid JSON in this exact structure:
{
  "designs": [
    {
      "id": "design-1",
      "name": "Creative Architectural Style Name",
      "blurb": "1-sentence explanation of why these specific floor, wall, ceiling & furniture dimensions suit this room.",
      "products": {
        "floor": "<exact_id_from_catalogue>",
        "wall": "<exact_id_from_catalogue>",
        "ceiling": "<exact_id_from_catalogue>",
        "joinery": "<exact_id_from_catalogue>",
        "sofa": "<exact_id_from_catalogue>",
        "table": "<exact_id_from_catalogue>",
        "curtain": "<exact_id_from_catalogue>"
      },
      "layoutHint": {
        "sofaXFrac": 0.50,
        "sofaDepthFrac": 0.37,
        "tableOffsetX": 0.0,
        "wallPref": "right"
      }
    }
  ]
}`,
            },
            {
              role: "user",
              content: JSON.stringify({
                preferredTheme: preferredTheme ?? "diverse_showcase",
                windowDetected: hasWindow,
                roomGeometry: roomGeometrySummary,
                liveCatalogue: catalogueWithDimensions,
              }),
            },
          ],
        });

        const parsed = JSON.parse(
          completion.choices[0]?.message?.content ?? "{}"
        );
        if (Array.isArray(parsed.designs) && parsed.designs.length >= 4) {
          rawThemes = parsed.designs.slice(0, 4);
        }
      } catch (gptErr) {
        console.warn(
          "OpenAI call failed — using 100% dynamic live-catalogue rotation:",
          (gptErr as Error).message
        );
      }
    }

    // Track used surface IDs so even if AI repeats a floor/wall, we enforce variety across the 4 cards
    const usedFloors = new Set<string>();
    const usedWalls = new Set<string>();
    const usedCeilings = new Set<string>();

    const designs = rawThemes.map((d: any, idx: number) => {
      const resolvedProducts: Record<string, string | null> = {};

      for (const slot of ALL_SLOTS) {
        const slotList = productsBySlot[slot] ?? [];
        const candidateId = d.products?.[slot];

        if (candidateId && allowed.has(candidateId)) {
          resolvedProducts[slot] = candidateId;
        } else {
          resolvedProducts[slot] =
            slotList[idx % Math.max(1, slotList.length)] ?? null;
        }
      }

      // Enforce variety across the 4 designs so new floors/walls/ceilings in products.ts always appear!
      const floorPool = productsBySlot.floor ?? [];
      if (
        resolvedProducts.floor &&
        usedFloors.has(resolvedProducts.floor) &&
        floorPool.length > usedFloors.size
      ) {
        const unusedFloor = floorPool.find((id) => !usedFloors.has(id));
        if (unusedFloor) resolvedProducts.floor = unusedFloor;
      }
      if (resolvedProducts.floor) usedFloors.add(resolvedProducts.floor);

      const wallPool = productsBySlot.wall ?? [];
      if (
        resolvedProducts.wall &&
        usedWalls.has(resolvedProducts.wall) &&
        wallPool.length > usedWalls.size
      ) {
        const unusedWall = wallPool.find((id) => !usedWalls.has(id));
        if (unusedWall) resolvedProducts.wall = unusedWall;
      }
      if (resolvedProducts.wall) usedWalls.add(resolvedProducts.wall);

      const ceilingPool = productsBySlot.ceiling ?? [];
      if (
        resolvedProducts.ceiling &&
        usedCeilings.has(resolvedProducts.ceiling) &&
        ceilingPool.length > usedCeilings.size
      ) {
        const unusedCeiling = ceilingPool.find((id) => !usedCeilings.has(id));
        if (unusedCeiling) resolvedProducts.ceiling = unusedCeiling;
      }
      if (resolvedProducts.ceiling) usedCeilings.add(resolvedProducts.ceiling);

      if (!hasWindow) {
        resolvedProducts.curtain = null;
      }

      const safeSurfaceProducts: Record<string, string | null> = {
        floor: resolvedProducts.floor,
        wall: resolvedProducts.wall,
        ceiling: resolvedProducts.ceiling,
      };

      const placements = buildLayoutForVariant(
        analyzedAreas,
        resolvedProducts,
        idx,
        d.layoutHint
      );

      return {
        id: d.id ?? `design-${idx + 1}`,
        name: d.name ?? `Design ${idx + 1}`,
        blurb: d.blurb ?? "",
        products: safeSurfaceProducts,
        areaProducts: safeSurfaceProducts,
        allProducts: resolvedProducts,
        furnitureProductIds: [
          resolvedProducts.sofa,
          resolvedProducts.table,
          resolvedProducts.joinery,
        ].filter(Boolean),
        curtainProductId: resolvedProducts.curtain,
        placements,
      };
    });

    return NextResponse.json({ designs });
  } catch (err) {
    console.error("Design Generation Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate designs.",
      },
      { status: 500 }
    );
  }
}