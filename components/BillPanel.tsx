"use client";

import { useState } from "react";
import { downloadDesignPdf } from "@/lib/pdf";
import { money } from "@/lib/pricing";
import { whatsappUrl } from "@/lib/whatsapp";
import type { Bill, Slot } from "@/lib/types";

interface Props {
  bill: Bill;
  withFitting: boolean;
  onFittingChange: (value: boolean) => void;
  onRemove: (slot: Slot) => void;
  onReset: () => void;
}

export default function BillPanel({ bill, withFitting, onFittingChange, onRemove, onReset }: Props) {
  const [busy, setBusy] = useState(false);
  const empty = bill.lines.length === 0;

  async function handlePdf() {
    setBusy(true);
    try {
      await downloadDesignPdf(bill, withFitting);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside aria-label="Your bill" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-navy">Your Design</h2>
        {!empty && (
          <button onClick={onReset} className="text-xs text-ink/60 underline">Clear</button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-full bg-cream p-1 text-sm" role="group" aria-label="Service type">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            onClick={() => onFittingChange(v)}
            aria-pressed={withFitting === v}
            className={`rounded-full py-1.5 transition ${withFitting === v ? "bg-navy text-white" : "text-ink"}`}
          >
            {v ? "Supply + Fit" : "Supply only"}
          </button>
        ))}
      </div>

      {empty ? (
        <p className="mt-6 text-sm text-ink/60">Pick a material from the library to start your bill.</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 text-sm">
          {bill.lines.map((l) => (
            <li key={l.slot} className="flex items-start justify-between gap-2 py-2">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-ink/60">
                  {l.unit === "sqm" ? `${l.qty} sqm × ${money(l.unitPrice)}` : "1 item"}
                  {l.fitting > 0 && ` + fitting ${money(l.fitting)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span>{money(l.supply + l.fitting)}</span>
                <button onClick={() => onRemove(l.slot)} aria-label={`Remove ${l.name}`} className="text-ink/40 hover:text-ink">×</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
        <span className="text-sm text-ink/70">Estimated total</span>
        <span className="font-serif text-2xl text-navy">{money(bill.total)}</span>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          onClick={handlePdf}
          disabled={empty || busy}
          className="rounded-full bg-navy py-2.5 text-sm font-medium text-white transition hover:bg-navy/90 disabled:opacity-40"
        >
          {busy ? "Preparing PDF…" : "Download PDF"}
        </button>
        <a
          href={empty ? undefined : whatsappUrl(bill, withFitting)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={empty}
          className={`rounded-full bg-gold py-2.5 text-center text-sm font-medium text-ink transition ${
            empty ? "pointer-events-none opacity-40" : "hover:brightness-95"
          }`}
        >
          Send on WhatsApp
        </a>
      </div>
      <p className="mt-3 text-xs text-ink/50">Estimate only. Final price is confirmed after measurement.</p>
    </aside>
  );
}
