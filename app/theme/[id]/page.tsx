import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { THEMES_BY_ID } from "@/data/themes";
import { PRODUCTS_BY_ID } from "@/data/products";
import { FITTING_RATES, ROOM_AREA_SQM } from "@/lib/config";

interface PageProps {
  params: { id: string };
}

export default function ThemePage({ params }: PageProps) {
  const theme = THEMES_BY_ID[params.id];

  if (!theme) {
    notFound();
  }

  // Build bill items
  const items = Object.entries(theme.design).flatMap(([slot, productId]) => {
    if (!productId) return [];
    const product = PRODUCTS_BY_ID[productId];
    if (!product) return [];

    const qty = product.unit === "sqm" ? ROOM_AREA_SQM : 1;
    const supply = product.price * qty;
    const fitting = (FITTING_RATES[slot as keyof typeof FITTING_RATES] ?? 0) * qty;

    return [{
      slot,
      name: product.name,
      qty,
      unit: product.unit,
      supply,
      fitting,
    }];
  });

  const supplyTotal = items.reduce((s, i) => s + i.supply, 0);
  const fittingTotal = items.reduce((s, i) => s + i.fitting, 0);
  const grandTotal = supplyTotal + fittingTotal;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-navy hover:underline">
          ← Back to Lookbook
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: Theme Image */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream shadow-lg">
            <Image
              src={theme.image}
              alt={theme.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-6">
            <h1 className="font-serif text-3xl text-navy md:text-4xl">
              {theme.name}
            </h1>
            <p className="mt-2 text-base text-ink/70">{theme.blurb}</p>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/photo-studio"
              className="rounded-full bg-navy px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-cream shadow-md transition hover:bg-navy/90"
            >
              Design Your Own Room
            </Link>
            <Link
              href="/consultation"
              className="rounded-full border border-navy/30 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-navy transition hover:bg-cream"
            >
              Book This Design
            </Link>
          </div>

          <p className="mt-4 text-xs text-ink/60">
            Prices assume a {ROOM_AREA_SQM} sqm floor. Final price after home measurement.
          </p>
        </div>

        {/* Right: Bill */}
        <aside className="rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-serif text-xl text-navy">Your Bill</h2>
          <p className="mt-1 text-xs text-ink/60">
            Everything in this theme, supplied and fitted.
          </p>

          <ul className="mt-5 space-y-4">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-start justify-between border-b border-navy/5 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-navy">
                    {item.slot}
                  </p>
                  <p className="text-sm text-ink/80">{item.name}</p>
                  <p className="text-xs text-ink/50">
                    {item.qty} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-navy">
                    ${item.supply.toLocaleString()}
                  </p>
                  {item.fitting > 0 && (
                    <p className="text-xs text-ink/50">
                      + ${item.fitting.toLocaleString()} fitting
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t-2 border-navy/10 pt-4">
            <div className="flex justify-between text-sm text-ink/70">
              <span>Supply</span>
              <span>${supplyTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-ink/70">
              <span>Fitting</span>
              <span>${fittingTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-navy/10 pt-2 text-lg font-semibold text-navy">
              <span>Total</span>
              <span>${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}