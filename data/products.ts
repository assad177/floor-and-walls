import type { Product } from "@/lib/types";

export const PRODUCTS: Product[] = [
  // ===== FLOORS =====
  { id: "floor-oak", slot: "floor", name: "Natural Oak Wood", price: 42, unit: "sqm", color: "#C8A06B", pattern: "plank",image:"/products/textures/oak-floor.png" },
  { id: "floor-grey-lvp", slot: "floor", name: "Grey LVP Plank", price: 36, unit: "sqm", color: "#9A9C9E", pattern: "plank" },
  { id: "floor-carpet", slot: "floor", name: "Plush Beige Carpet", price: 28, unit: "sqm", color: "#CFC2AE", pattern: "plain" },
  { id: "floor-carpet2", slot: "floor", name: "Textured Carpet", price: 32, unit: "sqm", color: "#B0A590", pattern: "plain" },
  { id: "floor-tile", slot: "floor", name: "Slate Tile", price: 48, unit: "sqm", color: "#6F7377", pattern: "tile" },

  // ===== WALLS =====
  { id: "wall-cream", slot: "wall", name: "Warm Cream Paint", price: 120, unit: "each", color: "#EDE3D0" },
  { id: "wall-navy", slot: "wall", name: "Deep Navy Paint", price: 140, unit: "each", color: "#2C4A73" },
  { id: "wall-sage", slot: "wall", name: "Sage Paint", price: 130, unit: "each", color: "#A7B59E" },
  { id: "wall-charcoal", slot: "wall", name: "Charcoal Paint", price: 140, unit: "each", color: "#4A4F57" },
  { id: "wall-panel", slot: "wall", name: "Oak Slat Paneling", price: 350, unit: "each", color: "#A9794A", pattern: "panel" },

  // ===== CEILINGS =====
  { id: "ceiling-white", name: "Flat White", slot: "ceiling", price: 9, unit: "sqm", color: "#F5F2EC", pattern: "plain",image:"/products/ceiling.png" },
  { id: "ceiling-coffered", name: "Coffered Ceiling", slot: "ceiling", price: 34, unit: "sqm", color: "#EDE6D6", pattern: "panel" },
  { id: "ceiling-wood", name: "Wood Slat Ceiling", slot: "ceiling", price: 42, unit: "sqm", color: "#8B6F4E", pattern: "plank" },
  { id: "ceiling-warm", name: "Warm Off-White", slot: "ceiling", price: 10, unit: "sqm", color: "#F0E8D8", pattern: "plain" },
  { id: "ceiling-navy", name: "Navy Accent Ceiling", slot: "ceiling", price: 12, unit: "sqm", color: "#1B2A41", pattern: "plain" },

  // ===== CURTAINS & BLINDS =====
  { id: "curtain-linen", slot: "curtain", name: "Linen Beige Curtains", price: 140, unit: "each", color: "#D9CDB4",image:"/products/curtain.png" },
  { id: "curtain-green", slot: "curtain", name: "Forest Velvet Curtains", price: 180, unit: "each", color: "#2F5D45" },
  { id: "blind-grey", slot: "curtain", name: "Grey Roman Blind", price: 110, unit: "each", color: "#B9BCC0" ,image:"/products/blind.png"},

  // ===== JOINERY =====
  { id: "joinery-slat", slot: "joinery", name: "Slat Media Wall", price: 650, unit: "each", color: "#8A5A34",image:"/products/tv-wall.png" },
  { id: "joinery-navy", slot: "joinery", name: "Navy Media Unit", price: 580, unit: "each", color: "#2B4466" },
  { id: "joinery-walnut", slot: "joinery", name: "Walnut Media Wall", price: 720, unit: "each", color: "#5A3D2B" },

  // ===== SOFAS =====
  { id: "sofa-grey", slot: "sofa", name: "Grey Fabric Sofa", price: 480, unit: "each", color: "#8D9299", image: "/products/chair.png" },
  { id: "sofa-terracotta", slot: "sofa", name: "Terracotta Sofa", price: 520, unit: "each", color: "#C06A4D" },
  { id: "sofa-navy", slot: "sofa", name: "Navy Velvet Sofa", price: 560, unit: "each", color: "#2F4E7A" },
  { id: "sofa-beige", slot: "sofa", name: "Beige Fabric Sofa", price: 580, unit: "each", color: "#E5DCC8", image: "/products/sofa-beige.png" },
  
  // ===== DECOR =====
  { id: "plant", slot: "sofa", name: "Indoor Plant", price: 80, unit: "each", color: "#4A7C59", image: "/products/plant.png" },

  // ===== TABLES =====
  { id: "table-oak", slot: "table", name: "Oak Coffee Table", price: 120, unit: "each", color: "#B98A56", image: "/products/table.png" },
  { id: "table-black", slot: "table", name: "Black Coffee Table", price: 160, unit: "each", color: "#2A2A2E" },
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
);