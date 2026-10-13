"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy/5 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy/70 text-cream">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <div>
            <span className="block font-serif text-lg font-semibold leading-tight text-navy">
              Floors & Walls
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-gold">
              Design Studio
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-2 rounded-full bg-navy/5 p-1 md:flex">
          {[
            { href: "/photo-studio", label: "Design Studio" },
            { href: "/", label: "Lookbook" },
            { href: "/", label: "Process" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-navy transition hover:bg-white hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/consultation"
          className="hidden rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-cream shadow-md transition hover:shadow-xl md:block"
        >
          Book a Consultation
        </Link>
      </div>
    </header>
  );
}