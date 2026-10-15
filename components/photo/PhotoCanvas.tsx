"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
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
  products: Record<string, string | null>;
  activeType: AreaType;
  furniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  onAddPoint: (point: Point) => boolean;
  onClose: (areaId: string) => void;
  onMovePoint: (areaId: string, index: number, point: Point) => void;
  onSetPoints: (areaId: string, points: Point[]) => void;
  onInsertPoint: (areaId: string, index: number, point: Point) => void;
  onRemovePoint: (areaId: string, index: number) => void;
  onFurnitureSelect: (id: string | null) => void;
  onFurnitureUpdate: (id: string, patch: Partial<FurnitureItem>) => void;
}

const MARGIN = 6;
const PADDING = MARGIN / (100 + 2 * MARGIN);

const AREA_COLORS: Record<AreaType, string> = {
  wall: "#3B82F6",
  floor: "#22C55E",
  ceiling: "#A855F7",
  window: "#F59E0B",
};

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
    original: Point[];
  } | null>(null);

  const vertexMoved = useRef(false);

  const [aspect, setAspect] = useState(0.75);
  const [width, setWidth] = useState(600);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setNotice(null);
  }, [activeType]);

  const height = 100 * aspect;
  const unit = 100 / Math.max(width * (1 - 2 * PADDING), 1);

  const toView = (point: Point): [number, number] => [
    point.x * 100,
    point.y * height,
  ];

  const clampX = (value: number) =>
    Math.min(1 + MARGIN / 100, Math.max(-MARGIN / 100, value));

  const clampY = (value: number) =>
    Math.min(
      1 + MARGIN / height,
      Math.max(-MARGIN / height, value)
    );

  const rawPoint = (event: {
    clientX: number;
    clientY: number;
  }): Point => {
    const image = imgRef.current;
    if (!image) return { x: 0, y: 0 };

    const rect = image.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  const toPoint = (event: {
    clientX: number;
    clientY: number;
  }): Point => {
    const point = rawPoint(event);

    return {
      x: clampX(point.x),
      y: clampY(point.y),
    };
  };

  const handleTap = (event: MouseEvent<SVGSVGElement>) => {
    onFurnitureSelect(null);

    const added = onAddPoint(toPoint(event));
    const max = MAX_AREAS[activeType];

    setNotice(
      added
        ? null
        : `Only ${max} ${activeType}${max > 1 ? "s" : ""} can be marked. Use Clear to start again.`
    );
  };

  const texturedIds = Array.from(
    new Set(
      Object.values(products).filter(
        (id): id is string => Boolean(id && TEXTURES[id])
      )
    )
  );

  const editableAreas = areas.filter(
    (area) => area.type === activeType && !area.closed
  );

  return (
    <div>
      <div
        ref={wrapRef}
        className="rounded-xl bg-navy/5"
        style={{ padding: `${PADDING * 100}%` }}
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={photoUrl}
            alt="Your room"
            className="block w-full select-none rounded-md"
            draggable={false}
            onLoad={(event) => {
              const image = event.currentTarget;
              if (image.naturalWidth) {
                setAspect(image.naturalHeight / image.naturalWidth);
              }
            }}
          />

          <svg
            viewBox={`-${MARGIN} -${MARGIN} ${100 + 2 * MARGIN} ${height + 2 * MARGIN}`}
            style={{
              position: "absolute",
              left: `${-MARGIN}%`,
              top: `${(-MARGIN / height) * 100}%`,
              width: `${100 + 2 * MARGIN}%`,
              height: `${((height + 2 * MARGIN) / height) * 100}%`,
              overflow: "visible",
              cursor: "crosshair",
            }}
            onClick={handleTap}
          >
            <defs>
              <clipPath id="room-photo-clip">
                <rect width="100" height={height} />
              </clipPath>

              {texturedIds.map((id) => {
                const texture = TEXTURES[id];
                const size = texture.tile
                  ? texture.tile * 100
                  : undefined;

                return (
                  <pattern
                    key={id}
                    id={`room-texture-${id}`}
                    patternUnits={
                      texture.tile ? "userSpaceOnUse" : "objectBoundingBox"
                    }
                    width={size ?? 1}
                    height={size ?? 1}
                  >
                    <image
                      href={texture.src}
                      width={texture.tile ? size : "100%"}
                      height={texture.tile ? size : "100%"}
                      preserveAspectRatio="none"
                    />
                  </pattern>
                );
              })}
            </defs>

            <g clipPath="url(#room-photo-clip)" pointerEvents="none">
              {areas.map((area) => {
                const points = area.points
                  .map((point) => {
                    const [x, y] = toView(point);
                    return `${x},${y}`;
                  })
                  .join(" ");

                // Each area gets its own product; windows remain unpainted.
                const productId =
                  area.type === "window" ? null : products[area.id];

                const product = productId
                  ? PRODUCTS_BY_ID[productId]
                  : undefined;

                const fill = product
                  ? TEXTURES[product.id]
                    ? `url(#room-texture-${product.id})`
                    : product.color
                  : AREA_COLORS[area.type];

                const stroke =
                  area.type === activeType ? AREA_COLORS[area.type] : "#FFFFFF";

                return (
                  <g key={area.id}>
                    <polygon
                      points={points}
                      fill={fill}
                      fillOpacity={
                        product ? 0.92 : area.type === "window" ? 0.45 : 0.25
                      }
                      style={
                        product ? { mixBlendMode: "multiply" } : undefined
                      }
                    />

                    {isComplete(area) ? (
                      <polygon
                        points={points}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={area.type === activeType ? 2 : 1}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : (
                      <polyline
                        points={points}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {editableAreas.flatMap((area) =>
              area.points.map((point, index) => {
                const next = area.points[(index + 1) % area.points.length];
                const midpoint = {
                  x: (point.x + next.x) / 2,
                  y: (point.y + next.y) / 2,
                };
                const [x, y] = toView(midpoint);

                return (
                  <g
                    key={`mid-${area.id}-${index}`}
                    style={{ cursor: "copy" }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onInsertPoint(area.id, index, midpoint);
                    }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={9 * unit}
                      fill="#FFFFFF"
                      stroke={AREA_COLORS[area.type]}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={x}
                      y={y}
                      fontSize={13 * unit}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={AREA_COLORS[area.type]}
                      pointerEvents="none"
                    >
                      +
                    </text>
                  </g>
                );
              })
            )}

            {editableAreas.flatMap((area) =>
              area.points.map((point, index) => {
                const [x, y] = toView(point);
                const canClose =
                  index === 0 && area.points.length >= MIN_POINTS;

                return (
                  <circle
                    key={`${area.id}-${index}`}
                    cx={x}
                    cy={y}
                    r={(canClose ? 14 : 11) * unit}
                    fill={canClose ? "#16A34A" : AREA_COLORS[area.type]}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: "grab", touchAction: "none" }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (canClose && !vertexMoved.current) {
                        onClose(area.id);
                      }
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation();
                      onRemovePoint(area.id, index);
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      vertexMoved.current = false;
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                        return;
                      }

                      vertexMoved.current = true;
                      onMovePoint(area.id, index, toPoint(event));
                    }}
                    onPointerUp={(event) => {
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId);
                      }
                    }}
                  />
                );
              })
            )}

            {editableAreas.flatMap((area) =>
              area.points.map((point, index) => {
                const nextIndex = (index + 1) % area.points.length;
                const next = area.points[nextIndex];
                const [x1, y1] = toView(point);
                const [x2, y2] = toView(next);

                return (
                  <line
                    key={`edge-${area.id}-${index}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth={18}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: "move", touchAction: "none" }}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      event.currentTarget.setPointerCapture(event.pointerId);

                      edgeDrag.current = {
                        areaId: area.id,
                        i: index,
                        j: nextIndex,
                        start: rawPoint(event),
                        original: area.points,
                      };
                    }}
                    onPointerMove={(event) => {
                      const drag = edgeDrag.current;

                      if (
                        !drag ||
                        !event.currentTarget.hasPointerCapture(event.pointerId)
                      ) {
                        return;
                      }

                      const current = rawPoint(event);
                      const dx = current.x - drag.start.x;
                      const dy = current.y - drag.start.y;

                      onSetPoints(
                        drag.areaId,
                        drag.original.map((point, pointIndex) =>
                          pointIndex === drag.i || pointIndex === drag.j
                            ? {
                                x: clampX(point.x + dx),
                                y: clampY(point.y + dy),
                              }
                            : point
                        )
                      );
                    }}
                    onPointerUp={(event) => {
                      edgeDrag.current = null;

                      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId);
                      }
                    }}
                  />
                );
              })
            )}
          </svg>

          <FurnitureLayer
            items={furniture}
            selectedId={selectedFurnitureId}
            onSelect={onFurnitureSelect}
            onUpdate={onFurnitureUpdate}
          />
        </div>
      </div>

      <p
        className="mt-2 min-h-5 text-xs text-ink/60"
        role="status"
        aria-live="polite"
      >
        {notice}
      </p>
    </div>
  );
}