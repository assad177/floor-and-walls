import type { Theme } from "@/lib/types";

export const THEMES: Theme[] = [
  {
    id: "minimalist",
    name: "Modern Minimalist",
    blurb: "Light, calm and uncluttered.",
    image: "/themes/minimalist.png",
    design: {
      floor: "floor-oak",
      wall: "wall-cream",
      ceiling: "ceiling-white",
      curtain: "blind-grey",
      joinery: "joinery-slat",
      sofa: "sofa-grey",
      table: "table-oak",
    },
  },
  {
    id: "warm-luxury",
    name: "Warm Luxury",
    blurb: "Rich navy, velvet and warm wood.",
    image: "/themes/warm-luxury.png",
    design: {
      floor: "floor-oak",
      wall: "wall-navy",
      ceiling: "ceiling-warm",
      curtain: "curtain-green",
      joinery: "joinery-walnut",
      sofa: "sofa-terracotta",
      table: "table-black",
    },
  },
  {
    id: "industrial",
    name: "Industrial Chic",
    blurb: "Slate floors and charcoal walls.",
    image: "/themes/industrial.png",
    design: {
      floor: "floor-tile",
      wall: "wall-charcoal",
      ceiling: "ceiling-white",
      curtain: "blind-grey",
      joinery: "joinery-navy",
      sofa: "sofa-grey",
      table: "table-black",
    },
  },
  {
    id: "japandi",
    name: "Japandi",
    blurb: "Soft sage, linen and natural timber.",
    image: "/themes/japandi.png",
    design: {
      floor: "floor-grey-lvp",
      wall: "wall-sage",
      ceiling: "ceiling-coffered",
      curtain: "curtain-linen",
      joinery: "joinery-slat",
      sofa: "sofa-navy",
      table: "table-oak",
    },
  },
];

export const THEMES_BY_ID: Record<string, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t])
);