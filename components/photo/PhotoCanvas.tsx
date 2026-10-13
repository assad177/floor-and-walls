"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCTS_BY_ID } from "@/data/products";
import { TEXTURES } from "@/data/textures";
import {
  MAX_AREAS,
  MIN_POINTS,
  isComplete,
  type Area,
  type AreaType,
  type FurnitureItem,
  type Point,
} from "@/hooks/usePhotoDesign";
import FurnitureLayer from "./Furniturelayer";

interface Props {
  photoUrl: string;
  areas: Area[];
  products: Record<AreaType, string | null>;
  activeType: AreaType;
  furniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  /** Returns false when the active type is already at its limit. */
  onAddPoint: (p: Point) => boolean;
  onClose: (areaId: string) => void;
  onMovePoint: (areaId: string, index: number, p: Point) => void;
  onSetPoints: (areaId: string, points: Point[]) => void;
  onInsertPoint: (areaId: string, index: number, p: Point) => void;
  onRemovePoint: (areaId: string, index: number) => void;
  onFurnitureSelect: (id: string | null) => void;
  onFurnitureUpdate: (id: string, patch: Partial<FurnitureItem>) => void;
}

/** Corners may sit this far (viewBox units, 100 = photo width) outside the photo. */
const M = 6;
const PAD = M / (100 + 2 * M);

export default function PhotoCanvas({
  photoUrl,
  areas,
  products,
  activeType,
  furniture,
  selectedFurnitureId,
  onAddPoint,
  onClose,
  onMovePoint,
  onSetPoints,
  onInsertPoint,
  onRemovePoint,
  onFurnitureSelect,
  onFurnitureUpdate,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const edgeDrag = useRef<{
    areaId: string;
    i: number;
    j: number;
    start: Point;
    orig: Point[];
  } | null>(null);
  const vertexMoved = useRef(false);
  const [aspect, setAspect] = useState(0.75); // photo height / width
  const [width, setWidth] = useState(600);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // a message about one area type should not follow the user to another
  useEffect(() => setNotice(null), [activeType]);

  const H = 100 * aspect;
  const u = 100 / Math.max(width * (1 - 2 * PAD), 1); // viewBox units per screen pixel
  const toView = (p: Point) => [p.x * 100, p.y * H] as const;
  const clampX = (n: number) => Math.min(1 + M / 100, Math.max(-M / 100, n));
  const clampY = (n: number) => Math.min(1 + M / H, Math.max(-M / H, n));

  /** Screen position -> fraction of the photo, not clamped. */
  const rawPoint = (e: { clientX: number; clientY: number }): Point => {
    const r = imgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const toPoint = (e: { clientX: number; clientY: number }): Point => {
    const p = rawPoint(e);
    return { x: clampX(p.x), y: clampY(p.y) };
  };

  const handleTap = (e: React.MouseEvent<SVGSVGElement>) => {
    onFurnitureSelect(null);
    const ok = onAddPoint(toPoint(e));
    const max = MAX_AREAS[activeType];
    setNotice(
      ok ? null : `Only ${max} ${activeType}${max > 1 ? "s" : ""} can be marked. Use Clear to start again.`,
    );
  };

  const texturedIds = Array.from(
    new Set(Object.values(products).filter((id): id is string => !!id && !!TEXTURES[id])),
  );

  // Only shapes still being drawn show handles. Once a shape is closed they disappear.
  const editable = areas.filter((a) => a.type === activeType && !a.closed);

  return (
    <div>
      <div ref={wrapRef} className="rounded-xl bg-navy/5" style={{ padding: `${PAD * 100}%` }}>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={photoUrl}
            alt="Your room"
            className="block w-full select-none rounded-md"
            draggable={false}
            onLoad={(e) => setAspect(e.currentTarget.naturalHeight / e.currentTarget.naturalWidth)}
          />

          <svg
            viewBox={`${-M} ${-M} ${100 + 2 * M} ${H + 2 * M}`}
            style={{
              position: "absolute",
              left: `${-M}%`,
              top: `${(-M / H) * 100}%`,
              width: `${100 + 2 * M}%`,
              height: `${((H + 2 * M) / H) * 100}%`,
              overflow: "visible",
              cursor: "crosshair",
            }}
            onClick={handleTap}
          >
            <defs>
              <clipPath id="photo-clip">
                <rect x={0} y={0} width={100} height={H} />
              </clipPath>

              {texturedIds.map((id) => {
                const t = TEXTURES[id];
                if (t.tile) {
                  // repeats at a fixed size, so planks and tiles look the right scale
                  const size = t.tile * 100; // viewBox units, where 100 is the photo's width
                  return (
                    <pattern key={id} id={`tex-${id}`} patternUnits="userSpaceOnUse" width={size} height={size}>
                      <image href={t.src} width={size} height={size} preserveAspectRatio="none" />
                    </pattern>
                  );
                }
                // no tile: one copy stretched over the whole area
                return (
                  <pattern key={id} id={`tex-${id}`} patternUnits="objectBoundingBox" width="1" height="1">
                    <image href={t.src} width="100%" height="100%" preserveAspectRatio="none" />
                  </pattern>
                );
              })}
            </defs>

            {/* materials are clipped to the photo, so a shape running past the edge fills right up to it */}
            <g clipPath="url(#photo-clip)" pointerEvents="none">
              {areas.map((area) => {
                const str = area.points
                  .map(toView)
                  .map(([x, y]) => `${x},${y}`)
                  .join(" ");
                const product = products[area.type] ? PRODUCTS_BY_ID[products[area.type] as string] : undefined;
                const fill = product ? (TEXTURES[product.id] ? `url(#tex-${product.id})` : product.color) : "#3B82F6";
                const stroke = area.type === activeType ? "#3B82F6" : "#fff";

                return isComplete(area) ? (
                  <g key={area.id}>
                    <polygon
                      points={str}
                      fill={fill}
                      fillOpacity={product ? 0.92 : 0.25}
                      // multiply keeps the photo's light and shadow showing through the new material
                      style={product ? { mixBlendMode: "multiply" } : undefined}
                    />
                    <polygon
                      points={str}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={area.type === activeType ? 2 : 1}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ) : (
                  <g key={area.id}>
                    <polygon points={str} fill="#3B82F6" fillOpacity={0.12} />
                    <polyline
                      points={str}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}
            </g>

            {/* edges: grab a line and move it anywhere */}
            {editable.flatMap((area) =>
              area.points.map((p, i) => {
                const j = (i + 1) % area.points.length;
                const [x1, y1] = toView(p);
                const [x2, y2] = toView(area.points[j]);
                return (
                  <line
                    key={`edge-${area.id}-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth={18}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: "move", touchAction: "none" }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      edgeDrag.current = { areaId: area.id, i, j, start: rawPoint(e), orig: area.points };
                    }}
                    onPointerMove={(e) => {
                      const d = edgeDrag.current;
                      if (!d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
                      const c = rawPoint(e);
                      const dx = c.x - d.start.x;
                      const dy = c.y - d.start.y;
                      onSetPoints(
                        d.areaId,
                        d.orig.map((q, k) =>
                          k === d.i || k === d.j ? { x: clampX(q.x + dx), y: clampY(q.y + dy) } : q,
                        ),
                      );
                    }}
                    onPointerUp={(e) => {
                      edgeDrag.current = null;
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    }}
                  />
                );
              }),
            )}

            {/* "+" in the middle of each edge: tap to add a corner there */}
            {editable.flatMap((area) =>
              area.points.map((p, i) => {
                const q = area.points[(i + 1) % area.points.length];
                const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
                const [x, y] = toView(mid);
                return (
                  <g
                    key={`mid-${area.id}-${i}`}
                    style={{ cursor: "copy" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInsertPoint(area.id, i, mid);
                    }}
                  >
                    <circle cx={x} cy={y} r={9 * u} fill="#fff" stroke="#3B82F6" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                    <text
                      x={x}
                      y={y}
                      fontSize={13 * u}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#3B82F6"
                      pointerEvents="none"
                    >
                      +
                    </text>
                  </g>
                );
              }),
            )}

            {/* corner handles, sized for a finger */}
            {editable.flatMap((area) =>
              area.points.map((p, i) => {
                const [x, y] = toView(p);
                const closesShape = !area.closed && i === 0 && area.points.length >= MIN_POINTS;
                return (
                  <circle
                    key={`${area.id}-${i}`}
                    cx={x}
                    cy={y}
                    r={(closesShape ? 14 : 11) * u}
                    fill={closesShape ? "#16A34A" : "#3B82F6"}
                    stroke="#fff"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: "grab", touchAction: "none" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // tapping the green first corner closes the shape (but not at the end of a drag)
                      if (closesShape && !vertexMoved.current) onClose(area.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onRemovePoint(area.id, i);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      vertexMoved.current = false;
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                      vertexMoved.current = true;
                      onMovePoint(area.id, i, toPoint(e));
                    }}
                  />
                );
              }),
            )}
          </svg>

          {/* furniture is an HTML layer over the photo */}
          <FurnitureLayer
            items={furniture}
            selectedId={selectedFurnitureId}
            onSelect={onFurnitureSelect}
            onUpdate={onFurnitureUpdate}
          />
        </div>
      </div>

      <p className="mt-2 min-h-5 text-xs text-ink/60" role="status" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}