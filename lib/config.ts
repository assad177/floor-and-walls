import type { Slot ,Product} from "./types";
import { Design } from "./types";
export const CURRENCY = "$";
/** Assumed room floor area until the customer can enter their own size. */
export const ROOM_AREA_SQM = 20;
/** Replace with the client's WhatsApp Business number (digits only, with country code). */
export const WHATSAPP_NUMBER = "";

export const SLOTS: { id: Slot; label: string }[] = [
  { id: "floor", label: "Flooring" },
  { id: "wall", label: "Walls" },
  { id: "ceiling", label: "Ceiling" },
  { id: "curtain", label: "Window" },
  { id: "joinery", label: "Joinery" },
  { id: "sofa", label: "Sofa" },
  { id: "table", label: "Tables" },
];

/** Fitting charge: per sqm for floors, per item for everything else. */
export const FITTING_RATES: Record<Slot, number> = {
  floor: 15,
  wall: 90,
  ceiling: 60,      // ← NAYA — ceiling fitting charge
  curtain: 35,
  joinery: 180,
  sofa: 0,
  table: 0,
};

export const FURNITURE_WIDTH: Partial<Record<Slot, number>> = {
  sofa: 0.4,
  table: 0.22,
  curtain: 0.2,     // ← Curtains (narrow, tall)
  joinery: 0.25,    // ← TV Wall (wide)
};

/** Items that hang on a wall rather than stand on the floor. */
export const WALL_ITEM_SLOTS: Slot[] = ["joinery", "curtain"];

/** Suggested wall angle (degrees) from an item's horizontal position: left-wall items lean one way, right-wall the other. */
export const autoWallAngle = (x: number): number =>
  Math.round(Math.max(-45, Math.min(45, (0.5 - x) * 120)));


/** True for products that hang on a wall (curtains, media walls, mirrors, frames...). */
export const isWallItem = (p: Product | undefined): boolean => p?.placement === "wall";


export const EMPTY_DESIGN: Design = {
  floor: null,
  wall: null,
  ceiling: null,
  curtain: null,
  joinery: null,
  sofa: null,
  table: null,
};