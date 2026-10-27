
import { PRODUCTS_BY_ID } from "@/data/products";
import { FITTING_RATES, ROOM_AREA_SQM } from "@/lib/config";
import type { Bill, BillLine, Design, Slot } from "@/lib/types";

const SLOTS: Slot[] = [
  "floor",
  "wall",
  "ceiling",
  "curtain",
  "joinery",
  "sofa",
  "table",
];

export interface AreaMaterial {
  areaId: string;
  slot: "floor" | "wall" | "ceiling";
  productId: string;
  areaSqm?: number;
}

interface BuildBillOptions {
  design?: Design;
  areaMaterials?: AreaMaterial[];
  withFitting: boolean;
  extras?: { productId: string; qty: number }[];
}

function createLine(
  slot: Slot,
  productId: string,
  qty: number,
  withFitting: boolean,
): BillLine | null {
  const product = PRODUCTS_BY_ID[productId];

  if (!product || qty <= 0) return null;

  return {
    slot,
    name: product.name,
    qty,
    unit: product.unit,
    unitPrice: product.price,
    supply: product.price * qty,
    fitting: withFitting
      ? (FITTING_RATES[slot] ?? 0) * qty
      : 0,
  };
}


export function buildBill(
  designOrOptions: Design | BuildBillOptions,
  withFittingArg?: boolean,
  extrasArg: { productId: string; qty: number }[] = [],
): Bill {
  const isOptions =
    "withFitting" in designOrOptions &&
    typeof designOrOptions.withFitting === "boolean";

  const options: BuildBillOptions = isOptions
    ? (designOrOptions as BuildBillOptions)
    : {
        design: designOrOptions as Design,
        withFitting: withFittingArg ?? false,
        extras: extrasArg,
      };

  const {
    design,
    areaMaterials = [],
    withFitting,
    extras = [],
  } = options;

  const lines: BillLine[] = [];
  for (const area of areaMaterials) {
    const product = PRODUCTS_BY_ID[area.productId];
    if (!product) continue;

    const qty =
      product.unit === "sqm"
        ? area.areaSqm ??
          (area.slot === "floor" || area.slot === "ceiling"
            ? ROOM_AREA_SQM
            : 1)
        : 1;

    const line = createLine(
      area.slot,
      area.productId,
      qty,
      withFitting,
    );

    if (line) {
      lines.push({
        ...line,
        name: `${line.name} (${area.areaId})`,
      });
    }
  }


  if (design) {
    const representedSlots = new Set(
      areaMaterials.map((area) => area.slot),
    );

    for (const slot of SLOTS) {
      if (representedSlots.has(slot as AreaMaterial["slot"])) {
        continue;
      }

      const productId = design[slot];
      if (!productId) continue;

      const product = PRODUCTS_BY_ID[productId];
      if (!product) continue;

      const qty =
        product.unit === "sqm" ? ROOM_AREA_SQM : 1;

      const line = createLine(slot, productId, qty, withFitting);
      if (line) lines.push(line);
    }
  }

  // Furniture and other repeated products.
  for (const { productId, qty } of extras) {
    const product = PRODUCTS_BY_ID[productId];
    if (!product || qty < 1) continue;

    const line = createLine(
      product.slot,
      productId,
      qty,
      withFitting,
    );

    if (line) {
      lines.push({
        ...line,
        name: qty > 1 ? `${product.name} × ${qty}` : product.name,
      });
    }
  }

  const supplyTotal = lines.reduce(
    (sum, line) => sum + line.supply,
    0,
  );

  const fittingTotal = lines.reduce(
    (sum, line) => sum + line.fitting,
    0,
  );

  return {
    lines,
    supplyTotal,
    fittingTotal,
    total: supplyTotal + fittingTotal,
  };
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
