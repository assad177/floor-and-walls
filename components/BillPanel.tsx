"use client";

import { useState } from "react";
import { downloadDesignPdf } from "@/lib/pdf";
import { money } from "@/lib/pricing";
import { whatsappUrl } from "@/lib/whatsapp";
import type { Bill, Slot } from "@/lib/types";
import { FiCalendar, FiDownload } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

interface Props {
  bill: Bill;
  withFitting: boolean;
  onFittingChange: (value: boolean) => void;
  onRemove: (slot: Slot) => void;
  onReset: () => void;
}

export default function BillPanel({
  bill,
  withFitting,
  onFittingChange,
  onRemove,
  onReset,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lead, setLead] = useState({
    name: "",
    phone: "",
    postcode: "",
    notes: "",
  });

  const empty = bill.lines.length === 0;

  async function handlePdf() {
    setBusy(true);
    try {
      await downloadDesignPdf(bill, withFitting);
    } finally {
      setBusy(false);
    }
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    
    // Format design details for database storage
    const designDetails = bill.lines
      .map((l) => `${l.name} (${l.qty} ${l.unit})`)
      .join(", ");
    const fullDetails = `Postcode: ${lead.postcode} | Notes: ${lead.notes} | Items: ${designDetails} | Total: ${money(bill.total)} | Type: ${withFitting ? 'Supply + Fit' : 'Supply Only'}`;

    try {
      // 1. Send data to Admin DB First
      await fetch("/api/admin/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          email: "", // Optional email field
          details: fullDetails,
        }),
      });
      
      // 2. Auto-redirect to WhatsApp with pre-filled message
      const text = `Hi! I would like to book a fitting.\nName: ${lead.name}\nPhone: ${lead.phone}\nPostcode: ${lead.postcode}\nNotes: ${lead.notes}\n\nOrder Details:\n${designDetails}\nTotal: ${money(bill.total)}\nType: ${withFitting ? 'Supply + Fit' : 'Supply Only'}`;
      
      // Replace 923000000000 with your actual business WhatsApp number
      const url = `https://wa.me/923000000000?text=${encodeURIComponent(text)}`; 
      window.open(url, "_blank");

    } catch (error) {
      console.error("Failed to save lead:", error);
    }

    setTimeout(() => {
      setShowBookModal(false);
      setSubmitted(false);
      setLead({ name: "", phone: "", postcode: "", notes: "" });
    }, 2200);
  }

  return (
    <aside aria-label="Your bill" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-navy">Your Design</h2>
        {!empty && (
          <button onClick={onReset} className="text-xs text-ink/60 underline hover:text-ink">
            Clear
          </button>
        )}
      </div>

      <div
        className="mt-3 grid grid-cols-2 rounded-full bg-cream p-1 text-sm"
        role="group"
        aria-label="Service type"
      >
        {[false, true].map((v) => (
          <button
            key={String(v)}
            onClick={() => onFittingChange(v)}
            aria-pressed={withFitting === v}
            className={`rounded-full py-1.5 transition ${
              withFitting === v ? "bg-navy text-white shadow-sm" : "text-ink hover:bg-black/5"
            }`}
          >
            {v ? "Supply + Fit" : "Supply only"}
          </button>
        ))}
      </div>

      {empty ? (
        <p className="mt-6 text-sm text-ink/60 text-center py-4">
          Pick a material from the library to start your bill.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 text-sm">
          {bill.lines.map((l) => (
            <li
              key={l.slot}
              className="flex items-start justify-between gap-2 py-3"
            >
              <div>
                <p className="font-medium text-navy">{l.name}</p>
                <p className="text-xs text-ink/70 mt-0.5">
                  {l.unit === "sqm"
                    ? `${l.qty} sqm × ${money(l.unitPrice)}`
                    : "1 item"}
                  {l.fitting > 0 && ` + fitting ${money(l.fitting)}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-navy">{money(l.supply + l.fitting)}</span>
                <button
                  onClick={() => onRemove(l.slot)}
                  aria-label={`Remove ${l.name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/5 text-ink/50 transition hover:bg-red-50 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
        <span className="text-sm font-medium text-ink/70">Estimated total</span>
        <span className="font-serif text-2xl font-bold text-navy">
          {money(bill.total)}
        </span>
      </div>

      {/* NEW BUTTONS SECTION */}
      <div className="mt-6 flex flex-col gap-3">
        {/* Primary CTA (Main Button) */}
        <button
          type="button"
          onClick={() => setShowBookModal(true)}
          disabled={empty}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-navy/90 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
        >
          <FiCalendar className="text-lg transition-transform group-hover:scale-110" />
          Book Free Home Measurement
        </button>

        {/* Secondary Actions (Side by Side) */}
        <div className="flex gap-2">
          <button
            onClick={handlePdf}
            disabled={empty || busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cream px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-gold/20 disabled:pointer-events-none disabled:opacity-50"
          >
            <FiDownload className="text-lg" />
            {busy ? "Saving..." : "PDF"}
          </button>

          <a
            href={empty ? undefined : whatsappUrl(bill, withFitting)}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={empty}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors ${
              empty ? "pointer-events-none opacity-50" : "hover:bg-green-100 hover:text-green-800"
            }`}
          >
            <FaWhatsapp className="text-lg" />
            WhatsApp
          </a>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink/50">
        Estimate only. Final price is confirmed after free home measurement.
      </p>

      {/* Book Fitting Lead Submission Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {submitted ? (
              <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
                  ✓
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-navy">
                  Request Sent Successfully!
                </h3>
                <p className="mt-2 text-sm text-ink/70">
                  Redirecting to WhatsApp to complete your booking...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <h3 className="font-serif text-xl font-bold text-navy flex items-center gap-2">
                    <FiCalendar className="text-gold" />
                    Book Free Fitting
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink/50 hover:bg-ink/10 hover:text-ink transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="rounded-lg bg-cream p-3">
                  <p className="text-xs text-ink/70 leading-relaxed">
                    Submitting <strong className="text-navy">{bill.lines.length} items</strong> ({withFitting ? "Supply + Fit" : "Supply Only"}) — Estimated Total:{" "}
                    <strong className="text-navy text-sm">{money(bill.total)}</strong>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-navy uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={lead.name}
                      onChange={(e) => setLead({ ...lead, name: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full rounded-xl border border-ink/20 px-4 py-2.5 text-sm transition-colors focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-navy uppercase tracking-wider">
                        Phone Number *
                      </label>
                      <input
                        required
                        type="tel"
                        value={lead.phone}
                        onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                        placeholder="07700 900000"
                        className="w-full rounded-xl border border-ink/20 px-4 py-2.5 text-sm transition-colors focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-navy uppercase tracking-wider">
                        Postcode *
                      </label>
                      <input
                        required
                        type="text"
                        value={lead.postcode}
                        onChange={(e) => setLead({ ...lead, postcode: e.target.value })}
                        placeholder="SW1A 1AA"
                        className="w-full rounded-xl border border-ink/20 px-4 py-2.5 text-sm transition-colors focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-navy uppercase tracking-wider">
                      Preferred Date / Notes
                    </label>
                    <textarea
                      rows={2}
                      value={lead.notes}
                      onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                      placeholder="Deliver free sample box first, weekend measurement preferred..."
                      className="w-full rounded-xl border border-ink/20 px-4 py-2.5 text-sm transition-colors focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 rounded-xl border border-ink/20 py-3 text-sm font-bold text-ink/70 hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-navy py-3 text-sm font-bold text-white shadow-md hover:bg-navy/90 hover:shadow-lg transition-all"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}