export type Slot = "floor" | "wall" | "curtain" | "joinery" | "sofa" | "table" |"ceiling";
export type Pattern = "plain" | "plank" | "tile" | "panel";
export type Unit = "sqm" | "each";

export interface Product {
  id: string;
  slot: Slot;
  name: string;
  price: number; // supply price per unit
  unit: Unit;
  color: string; // 6-digit hex, used by the room preview
  pattern?: Pattern;
}

/** The id of the chosen product per slot, or null when nothing is chosen. */
export type Design = Record<Slot, string | null>;

export interface Theme {
  id: string;
  name: string;
  blurb: string;
  image: string;        // ← NAYA — thumbnail photo
  design: Design;
}

export interface BillLine {
  slot: Slot;
  name: string;
  qty: number;
  unit: Unit;
  unitPrice: number;
  supply: number;
  fitting: number;
}

export interface Bill {
  lines: BillLine[];
  supplyTotal: number;
  fittingTotal: number;
  total: number;
}

export interface Positions {
  sofa?: { x: number; y: number };
  table?: { x: number; y: number };
}
export interface Position {
  x: number;
  y: number;
}

export interface DesignWithPositions {
  design: Design;
  positions: Positions;
}

export interface Product {
  id: string;
  slot: Slot;
  name: string;
  price: number;
  unit: Unit;
  color: string;
  pattern?: Pattern;
  image?: string;  
  canvasSize?: { width: number; height: number }; 
  placement?: "floor" | "wall";    // ← yeh add karo (optional)
}