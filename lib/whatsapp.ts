import { WHATSAPP_NUMBER } from "./config";
import { money } from "./pricing";
import type { Bill } from "./types";

export function whatsappUrl(bill: Bill, withFitting: boolean): string {
  const items = bill.lines.map((l) => `- ${l.name}: ${money(l.supply + l.fitting)}`).join("\n");
  const text =
    `Hello Floors & Walls, I would like to book a consultation for my room design.\n\n` +
    `${items}\n\nService: ${withFitting ? "Supply + Fitting" : "Supply only"}\n` +
    `Estimated total: ${money(bill.total)}\n\n(My PDF design is attached.)`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
