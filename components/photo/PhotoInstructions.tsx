"use client";

const STEPS = [
  "Upload a clear, straight-on photo of your room in good lighting.",
  "Our AI automatically detects your walls, floor, ceiling, and windows in seconds.",
  "Browse the 4 AI-curated room concepts and click any lookbook to apply it instantly.",
  "Use 'Edit one item' to swap individual wall paints, flooring, curtains, or furniture.",
  "Click any furniture item on the canvas to drag, resize, rotate, or adjust its 3D wall angle.",
];

export default function PhotoInstructions() {
  return (
    <div className="rounded-xl border border-navy/10 bg-cream/40 p-4">
      <h3 className="text-sm font-semibold text-navy">How AI Room Designer works</h3>
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
        Tip: For the most accurate surface detection and perspective scaling, stand straight on so both the floor and main walls are clearly visible.
      </p>
    </div>
  );
}