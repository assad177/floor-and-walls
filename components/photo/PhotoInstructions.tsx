"use client";

import { MAX_AREAS } from "@/hooks/usePhotoDesign";

const STEPS = [
  "Pick Floor, Wall or Ceiling in the toolbar.",
  "Tap points around the edge of that area on your photo. Tap the green first point, or press Done, to close the shape.",
  "Drag a point or a line to fit the edges exactly. Tap + to add a corner, double-tap a point to remove it, or use Undo.",
  "Choose a material from the library and it appears on your room.",
  "Tap a sofa, table or other item to place it, then drag, resize, rotate or flip it.",
];

export default function PhotoInstructions() {
  return (
    <div className="rounded-xl border border-navy/10 bg-cream/40 p-4">
      <h3 className="text-sm font-semibold text-navy">How to use</h3>
      <ol className="mt-2 space-y-1.5">
        {STEPS.map((text, i) => (
          <li key={text} className="flex gap-2 text-xs text-ink/70">
            <span
              aria-hidden
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-cream"
            >
              {i + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-ink/60">
        Tip: you can mark up to {MAX_AREAS.wall} walls. For the best result, take the photo straight on, in good light.
      </p>
    </div>
  );
}