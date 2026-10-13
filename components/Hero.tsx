"use client";

import { useState } from "react";
import Link from "next/link";

interface Stop {
  value: string;
  label: string;
  disabled?: boolean;
}

const ROOMS: Stop[] = [
  { value: "living", label: "Living" },
  { value: "bedroom", label: "Bedroom", disabled: true },
  { value: "beach", label: "Beach", disabled: true },
];

// Themes hardcoded (themes.ts delete ki toh)
const THEME_STOPS: Stop[] = [
  { value: "minimalist", label: "Modern" },
  { value: "warm-luxury", label: "Warm" },
  { value: "industrial", label: "Industrial" },
  { value: "japandi", label: "Japandi" },
];

function StopSlider(props: {
  name: string;
  label: string;
  stops: Stop[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { name, label, stops, value, onChange } = props;
  const pos = (i: number) => (stops.length > 1 ? (i / (stops.length - 1)) * 100 : 0);
  const active = Math.max(0, stops.findIndex((s) => s.value === value));

  return (
    <fieldset className="min-w-0 flex-1">
      <legend className="w-full text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/90">
        {label}
      </legend>
      <div className="relative mx-6 sm:mx-10 mb-6 sm:mb-8 mt-4 sm:mt-5 h-3">
        <span className="absolute left-0 right-0 top-1.5 h-px bg-white/60" />
        {stops.map((s, i) => (
          <label
            key={s.value}
            className={`absolute top-0 -translate-x-1/2 text-center ${
              s.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
            style={{ left: `${pos(i)}%` }}
          >
            <input
              type="radio"
              name={name}
              value={s.value}
              checked={value === s.value}
              disabled={s.disabled}
              onChange={() => onChange(s.value)}
              className="peer sr-only"
            />
            <span className="mx-auto block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-white/50 peer-focus-visible:ring-2 peer-focus-visible:ring-gold" />
            <span className="mt-1.5 block whitespace-nowrap text-[9px] sm:text-[11px] text-white/90">
              {s.label}
            </span>
          </label>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-0.5 h-4 w-4 -translate-x-1/2 rounded-full bg-white shadow-md transition-all duration-300"
          style={{ left: `${pos(active)}%` }}
        />
      </div>
    </fieldset>
  );
}

export default function Hero() {
  const [room, setRoom] = useState("living");
  const [theme, setTheme] = useState(THEME_STOPS[0].value);

  return (
    <section
      className="relative isolate flex min-h-[600px] sm:min-h-[680px] items-center justify-center overflow-hidden bg-cover bg-center px-3 sm:px-4 py-12 sm:py-16"
      style={{
        backgroundImage:
          "linear-gradient(rgba(20,32,46,0.35), rgba(20,32,46,0.55)), url(/image.png), linear-gradient(135deg, #5b4636, #2c3e55)",
      }}
    >
      <div className="w-full max-w-3xl space-y-4 sm:space-y-6 text-center text-white">
        {/* HEADLINE CARD */}
        <div className="mx-auto max-w-2xl rounded-2xl bg-white/15 px-4 sm:px-8 py-6 sm:py-8 shadow-lg ring-1 ring-white/25 backdrop-blur-md">
          <p className="font-serif text-base sm:text-lg">Floors &amp; Walls</p>
          <h1 className="mt-2 sm:mt-3 text-xl sm:text-3xl md:text-4xl font-bold uppercase leading-tight tracking-wide">
            Don&apos;t Just Imagine Your Space.{" "}
            <span className="text-gold">Build It.</span>
          </h1>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-white/85 leading-relaxed">
            An interactive design experience. Mix floors, walls, media units, and
            furnishings in real-time — supplied and fitted by Floors &amp; Walls.
          </p>
        </div>

        {/* SELECTORS CARD */}
        <form
          action="/photo-studio"
          method="get"
          className="rounded-2xl bg-white/15 p-4 sm:p-6 shadow-lg ring-1 ring-white/25 backdrop-blur-md"
        >
          <div className="flex flex-col gap-6 sm:gap-4 md:flex-row md:gap-8">
            <StopSlider
              name="room"
              label="Select a room"
              stops={ROOMS}
              value={room}
              onChange={setRoom}
            />
            <StopSlider
              name="theme"
              label="Explore themes"
              stops={THEME_STOPS}
              value={theme}
              onChange={setTheme}
            />
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <button
              type="submit"
              className="rounded-full bg-cream px-6 sm:px-8 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-ink shadow transition hover:bg-white w-full sm:w-auto"
            >
              Start Designing Your Room
            </button>
            <Link
              href="/photo-studio"
              className="rounded-full border border-white/60 px-6 sm:px-8 py-3 text-xs sm:text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10 w-full sm:w-auto text-center"
            >
              Explore Templates
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}