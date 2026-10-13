import { money } from "./pricing";
import type { Bill } from "./types";

/** Builds and downloads the design summary PDF. jsPDF is loaded on demand (browser only). */
export async function downloadDesignPdf(bill: Bill, withFitting: boolean): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 22;
  doc.setFontSize(20).text("Floors & Walls: Your Room Design", 14, y);
  y += 8;
  doc.setFontSize(10).text(`Service: ${withFitting ? "Supply + Fitting" : "Supply only"}`, 14, y);
  y += 12;
  doc.setFontSize(11);
  doc.text("Item", 14, y); doc.text("Qty", 110, y); doc.text("Supply", 140, y); doc.text("Fitting", 170, y);
  y += 3; doc.line(14, y, 196, y); y += 7;
  for (const l of bill.lines) {
    doc.text(l.name, 14, y);
    doc.text(`${l.qty} ${l.unit === "sqm" ? "sqm" : ""}`.trim(), 110, y);
    doc.text(money(l.supply), 140, y);
    doc.text(money(l.fitting), 170, y);
    y += 8;
  }
  doc.line(14, y, 196, y); y += 9;
  doc.setFontSize(13).text(`Estimated total: ${money(bill.total)}`, 14, y);
  y += 12;
  doc.setFontSize(9).text("Estimate only. Final price is confirmed after measurement.", 14, y);
  doc.save("floors-and-walls-design.pdf");
}
