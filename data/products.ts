import type { Product } from "@/lib/types";

export const PRODUCTS: Product[] = [
  // ===== FLOORS =====
  { id: "floor-oak", slot: "floor", name: "Natural Oak Wood", price: 42, unit: "sqm", color: "#C8A06B", pattern: "plank",image:"/floor/floor-oak-wood.png" },
  { id: "floor-grey-lvp", slot: "floor", name: "Grey LVP Plank", price: 36, unit: "sqm", color: "#9A9C9E", pattern: "plank",image:"/floor/grey-plank.png" },
  { id: "floor-walnut", slot: "floor", name: "Walnut wood floor", price: 28, unit: "sqm", color: "#CFC2AE", pattern: "plain" ,image:"/floor/wallnut-wood-floor.png"},
  { id: "floor-carpet", slot: "floor", name: "Plush Carpet", price: 32, unit: "sqm", color: "#B0A590", pattern: "plain",image:"/floor/carpet.png" },
  { id: "floor-tile", slot: "floor", name: "white Tile", price: 48, unit: "sqm", color: "#6F7377", pattern: "tile",image:"/floor/white-marble.png" },

  // ===== WALLS =====
  // 1. Modern Minimalist & Scandinavian — Crisp, warm architectural off-white/alabaster
  { id: "wall-cream", slot: "wall", name: "Warm Alabaster Cream", price: 120, unit: "each", color: "#F3EFE6" },

  // 2. Industrial Chic & Classic — Rich heritage midnight/Oxford navy (tuned for multiply blend)
  { id: "wall-navy", slot: "wall", name: "Heritage Oxford Navy", price: 140, unit: "each", color: "#2B4257" },

  // 3. Japandi & Warm Luxury — Organic muted eucalyptus/olive sage
  { id: "wall-sage", slot: "wall", name: "Muted Eucalyptus Sage", price: 130, unit: "each", color: "#B8C4B6" },

  // 4. Dark Elegance & Contemporary — Soft architectural graphite/slate (won't crush wall shadows)
  { id: "wall-charcoal", slot: "wall", name: "Architectural Slate Charcoal", price: 140, unit: "each", color: "#525860" },

  // 5. Accent Wall Paneling (Client's explicit requirement) — Natural warm walnut/oak slat tone
  { id: "wall-panel", slot: "wall", name: "Natural Oak Slat Paneling", price: 350, unit: "each", color: "#BA8E63", pattern: "panel" },
  // 6. Warm Luxury / Japandi — Warm Cashmere Greige (Beige + Grey)
  { id: "wall-greige", slot: "wall", name: "Cashmere Warm Greige", price: 130, unit: "each", color: "#DDD5C7" },

  // 7. Contemporary / Earthy — Soft Terracotta Plaster
  { id: "wall-terracotta", slot: "wall", name: "Venetian Clay Plaster", price: 165, unit: "each", color: "#C88A74" },

  // ===== CEILINGS =====
  { id: "ceiling-white", name: "Flat White", slot: "ceiling", price: 9, unit: "sqm", color: "#F5F2EC", pattern: "plain",image:"/products/ceiling.png" },
  { id: "ceiling-coffered", name: "Coffered Ceiling", slot: "ceiling", price: 34, unit: "sqm", color: "#EDE6D6", pattern: "panel" },
  { id: "ceiling-wood", name: "Wood Slat Ceiling", slot: "ceiling", price: 42, unit: "sqm", color: "#8B6F4E", pattern: "plank",image:"/products/wood-slate.png" },
  { id: "ceiling-warm", name: "Warm Off-White", slot: "ceiling", price: 10, unit: "sqm", color: "#F0E8D8", pattern: "plain" },
  { id: "ceiling-navy", name: "Navy Accent Ceiling", slot: "ceiling", price: 12, unit: "sqm", color: "#1B2A41", pattern: "plain" },

  // ===== CURTAINS & BLINDS =====
  { id: "curtain-linen", slot: "curtain", name: "Linen Beige Curtains", price: 140, unit: "each", color: "#D9CDB4",image:"/products/curtain.png" },
  { id: "curtain-green", slot: "curtain", name: "Forest Velvet Curtains", price: 180, unit: "each", color: "#2F5D45",image:"/products/curtain.png" },
  // { id: "blind-grey", slot: "curtain", name: "Grey Roman Blind", price: 110, unit: "each", color: "#B9BCC0" ,image:"/products/blind.png"},

  // ===== JOINERY =====
  { id: "joinery-slat", slot: "joinery", name: "Slat Media Wall", price: 650, unit: "each", color: "#8A5A34",image:"/products/tv-wall.png" },
  { id: "joinery-navy", slot: "joinery", name: "Navy Media Unit", price: 580, unit: "each", color: "#2B4466" ,image:"/products/tv-wall.png"},
  { id: "joinery-walnut", slot: "joinery", name: "Walnut Media Wall", price: 720, unit: "each", color: "#5A3D2B" ,image:"/products/tv-wall.png"},

  // ===== SOFAS =====
  { id: "sofa-grey", slot: "sofa", name: "Grey Fabric Sofa", price: 480, unit: "each", color: "#8D9299", image: "/products/gray-fabric-sofa.png" },
  { id: "sofa-terracotta", slot: "sofa", name: "Terracotta Sofa", price: 520, unit: "each", color: "#C06A4D" ,image: "/products/sofa-beige.png" },
  { id: "sofa-navy", slot: "sofa", name: "Navy Velvet Sofa", price: 560, unit: "each", color: "#2F4E7A",image: "/products/navy-blue.png"  },
  { id: "sofa-beige", slot: "sofa", name: "Beige Fabric Sofa", price: 580, unit: "each", color: "#E5DCC8", image: "/products/sofa-beige.png" },
  
  // ===== DECOR =====
  // { id: "plant", slot: "sofa", name: "Indoor Plant", price: 80, unit: "each", color: "#4A7C59", image: "/products/plant.png" },

  // ===== TABLES =====
  { id: "table-oak", slot: "table", name: "Oak Coffee Table", price: 120, unit: "each", color: "#B98A56", image: "/products/table.png" },
  { id: "table-black", slot: "table", name: "Black Coffee Table", price: 160, unit: "each", color: "#2A2A2E",image:"/products/cofee-table.png" },
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
);