"use client";

import type { AreaType } from "@/hooks/usePhotoDesign";

/** Order and labels of the areas a user can mark. Keep in sync with AreaType. */
const AREAS: { id: AreaType; label: string }[] = [
  { id: "floor", label: "Floor" },
  { id: "wall", label: "Wall" },
  { id: "ceiling", label: "Ceiling" },
];

const HINT =
  "Tap points around the edge of the area. Tap the green first point or press Done to close it. " +
  "Then drag a point or a line to adjust, tap + to add a corner, and double-tap a point to remove it.";

interface Props {
  activeType: AreaType;
  onTypeChange: (t: AreaType) => void;
  /** Optional: removes the last point placed. */
  onUndo?: () => void;
  /** Optional: clears the shape of the active area. */
  onClear?: () => void;
  canUndo?: boolean;
  /** Optional: closes the shape being drawn. */
  onFinish?: () => void;
  canFinish?: boolean;
}

export default function PhotoToolbar({
  activeType,
  onTypeChange,
  onUndo,
  onClear,
  canUndo = false,
  onFinish,
  canFinish = false,
}: Props) {
  return (
    <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Area to mark">
        <span className="text-sm font-medium text-navy">Mark area:</span>
        {AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => onTypeChange(a.id)}
            aria-pressed={activeType === a.id}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeType === a.id ? "bg-navy text-white" : "bg-cream text-ink hover:bg-gold/30"
            }`}
          >
            {a.label}
          </button>
        ))}

        {(onFinish || onUndo || onClear) && (
          <span className="ml-auto flex flex-wrap gap-2">
            {onFinish && (
              <button
                onClick={onFinish}
                disabled={!canFinish}
                className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-40"
              >
                Done
              </button>
            )}
            {onUndo && (
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="rounded-full border border-navy/30 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-cream disabled:opacity-40"
              >
                Undo
              </button>
            )}
            {onClear && (
              <button
                onClick={onClear}
                className="rounded-full border border-navy/30 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-cream"
              >
                Clear {activeType}
              </button>
            )}
          </span>
        )}
      </div>

      <p className="text-xs text-ink/60" aria-live="polite">
        {HINT}
      </p>
    </div>
  );
}