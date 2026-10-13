import { PRODUCTS_BY_ID } from "@/data/products";
import { FITTING_RATES, ROOM_AREA_SQM } from "@/lib/config";
import type { Bill, BillLine, Design, Slot } from "@/lib/types";

const SLOTS: Slot[] = ["floor", "wall", "ceiling", "curtain", "joinery", "sofa", "table"];

export function buildBill(
  design: Design,
  withFitting: boolean,
  extras: { productId: string; qty: number }[] = [],
): Bill {
  const lines: BillLine[] = SLOTS.flatMap((slot) => {
    const productId = design[slot];
    const product = productId ? PRODUCTS_BY_ID[productId] : undefined;
    if (!product) return [];
    const qty = product.unit === "sqm" ? ROOM_AREA_SQM : 1;
    return [{
      slot,
      name: product.name,
      qty,
      unit: product.unit,
      unitPrice: product.price,
      supply: product.price * qty,
      fitting: withFitting ? (FITTING_RATES[slot] ?? 0) * qty : 0,
    }];
  });

  const extraLines: BillLine[] = extras.flatMap(({ productId, qty }) => {
    const p = PRODUCTS_BY_ID[productId];
    if (!p || qty < 1) return [];
    return [{
      slot: p.slot,
      name: qty > 1 ? `${p.name} × ${qty}` : p.name,
      qty,
      unit: p.unit,
      unitPrice: p.price,
      supply: p.price * qty,
      fitting: withFitting ? (FITTING_RATES[p.slot] ?? 0) * qty : 0,
    }];
  });

  const all = [...lines, ...extraLines];
  const supplyTotal = all.reduce((s, l) => s + l.supply, 0);
  const fittingTotal = all.reduce((s, l) => s + l.fitting, 0);
  return { lines: all, supplyTotal, fittingTotal, total: supplyTotal + fittingTotal };
}

export const money = (n: number) => `$${n}`;