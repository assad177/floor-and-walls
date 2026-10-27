"use client";

import { useState } from "react";
import { PRODUCTS_BY_ID } from "@/data/products";
import { TEXTURES } from "@/data/textures";
import type { Area, FurnitureItem, Point } from "@/hooks/usePhotoDesign";
import FurnitureLayer from "./Furniturelayer";

interface Props {
  photoUrl: string;
  areas: Area[];
  products: Record<string, string | null>;
  furniture: FurnitureItem[];
  selectedFurnitureId: string | null;
  isLoading?: boolean;
  loadingText?: string;
  onFurnitureSelect: (id: string | null) => void;
  onFurnitureUpdate: (id: string, patch: Partial<FurnitureItem>) => void;
}

function resolveSurfaceTexture(productId: string): {
  src: string;
  tile?: number;
} | null {
  if (TEXTURES[productId]) {
    return TEXTURES[productId];
  }
  const prod = PRODUCTS_BY_ID[productId] as
    | { image?: string; slot?: string }
    | undefined;
  if (prod?.image) {
    return {
      src: prod.image,
      tile: prod.slot === "floor" ? 0.28 : undefined,
    };
  }
  return null;
}

function isOpeningArea(area: Area): boolean {
  const typeStr = String(area.type ?? "").toLowerCase();
  const idStr = String(area.id ?? "").toLowerCase();
  const nameStr = String((area as { name?: string }).name ?? "").toLowerCase();
  return (
    typeStr === "window" ||
    typeStr === "door" ||
    idStr.includes("window") ||
    idStr.includes("door") ||
    nameStr.includes("window") ||
    nameStr.includes("door")
  );
}

export default function PhotoCanvas({
  photoUrl,
  areas,
  products,
  furniture,
  selectedFurnitureId,
  isLoading = false,
  loadingText = "AI is mapping your room & styling bespoke concepts…",
  onFurnitureSelect,
  onFurnitureUpdate,
}: Props) {
  const [aspect, setAspect] = useState(0.75);
  const height = 100 * aspect;

  const toView = (point: Point): [number, number] => [
    point.x * 100,
    point.y * height,
  ];

  const toPath = (points: Point[]) =>
    points
      .map((point, index) => {
        const [x, y] = toView(point);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";

  const activeProductIds = Array.from(
    new Set(Object.values(products).filter((id): id is string => Boolean(id)))
  );

  // Collect all window and door polygons (both standalone areas and embedded holes)
  // so they are cleanly masked out and never painted over by walls or floors.
  const openingPolygons: Point[][] = [];
  areas.forEach((area) => {
    if (isOpeningArea(area) && area.points.length >= 3) {
      openingPolygons.push(area.points);
    }
    if (Array.isArray(area.holes)) {
      area.holes.forEach((hole) => {
        if (hole.length >= 3) openingPolygons.push(hole);
      });
    }
  });

  return (
    <div className="overflow-hidden rounded-xl bg-navy/5 p-2 shadow-inner">
      <div
        className="relative overflow-hidden rounded-lg"
        onClick={() => onFurnitureSelect(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
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
          viewBox={`0 0 100 ${height}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <clipPath id="room-photo-clip">
              <rect width="100" height={height} />
            </clipPath>

            {/* Global Cut-Out Mask: Protects all Windows & Doors from Wall/Floor Paint Bleed */}
            <mask id="room-openings-mask">
              <rect width="100" height={height} fill="white" />
              {openingPolygons.map((poly, idx) => (
                <path key={`opening-cutout-${idx}`} d={toPath(poly)} fill="black" />
              ))}
            </mask>

            {activeProductIds.map((id) => {
              const tex = resolveSurfaceTexture(id);
              const prod = PRODUCTS_BY_ID[id];

              if (tex) {
                const size = tex.tile ? tex.tile * 100 : undefined;
                return (
                  <pattern
                    key={id}
                    id={`room-texture-${id}`}
                    patternUnits={
                      tex.tile ? "userSpaceOnUse" : "objectBoundingBox"
                    }
                    width={size ?? 1}
                    height={size ?? 1}
                  >
                    <image
                      href={tex.src}
                      width={tex.tile ? size : "100%"}
                      height={tex.tile ? size : "100%"}
                      preserveAspectRatio="none"
                    />
                  </pattern>
                );
              }

              if (prod?.pattern && prod.pattern !== "plain") {
                if (prod.pattern === "panel") {
                  return (
                    <pattern
                      key={id}
                      id={`room-texture-${id}`}
                      patternUnits="userSpaceOnUse"
                      width="3.2"
                      height="12"
                    >
                      <rect width="3.2" height="12" fill={prod.color} />
                      <rect
                        x="2.4"
                        width="0.8"
                        height="12"
                        fill="rgba(0,0,0,0.22)"
                      />
                    </pattern>
                  );
                }
                if (prod.pattern === "plank") {
                  return (
                    <pattern
                      key={id}
                      id={`room-texture-${id}`}
                      patternUnits="userSpaceOnUse"
                      width="16"
                      height="4.5"
                    >
                      <rect width="16" height="4.5" fill={prod.color} />
                      <line
                        x1="0"
                        y1="4.5"
                        x2="16"
                        y2="4.5"
                        stroke="rgba(0,0,0,0.18)"
                        strokeWidth="0.35"
                      />
                      <line
                        x1="8"
                        y1="0"
                        x2="8"
                        y2="4.5"
                        stroke="rgba(0,0,0,0.12)"
                        strokeWidth="0.25"
                      />
                    </pattern>
                  );
                }
                if (prod.pattern === "tile") {
                  return (
                    <pattern
                      key={id}
                      id={`room-texture-${id}`}
                      patternUnits="userSpaceOnUse"
                      width="10"
                      height="10"
                    >
                      <rect width="10" height="10" fill={prod.color} />
                      <path
                        d="M 10 0 L 0 0 0 10"
                        fill="none"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="0.4"
                      />
                    </pattern>
                  );
                }
              }

              return null;
            })}
          </defs>

          <g clipPath="url(#room-photo-clip)" mask="url(#room-openings-mask)">
            {areas.map((area) => {
              // Never paint over windows or doors
              if (isOpeningArea(area)) return null;

              const productId = products[area.id];
              const product = productId ? PRODUCTS_BY_ID[productId] : undefined;
              if (!product) return null;

              const hasPatternOrTexture = Boolean(
                resolveSurfaceTexture(product.id) ||
                  (product.pattern && product.pattern !== "plain")
              );

              const fill = hasPatternOrTexture
                ? `url(#room-texture-${product.id})`
                : product.color;

              const holes = area.holes ?? [];
              const pathData = [
                toPath(area.points),
                ...holes.map((hole) => toPath(hole)),
              ].join(" ");

              // Tuned opacity so original room shadows, corners, and moldings remain visible
              const fillOpacity =
                area.type === "wall"
                  ? 0.82
                  : area.type === "ceiling"
                    ? 0.85
                    : 0.88;

              return (
                <g key={`${area.id}-${product.id}`}>
                  <path
                    d={pathData}
                    fill={fill}
                    fillRule="evenodd"
                    fillOpacity={fillOpacity}
                    style={{ mixBlendMode: "multiply" }}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        <FurnitureLayer
          items={furniture}
          selectedId={selectedFurnitureId}
          onSelect={onFurnitureSelect}
          onUpdate={onFurnitureUpdate}
        />

        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-navy/65 p-6 text-center text-white backdrop-blur-xs">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-gold" />
            <p className="font-serif text-lg font-medium">{loadingText}</p>
            <p className="mt-1 text-xs text-white/75">
              Please wait while our AI detects room surfaces and curates matching products…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}