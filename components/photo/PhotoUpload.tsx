"use client";

import { useEffect, useRef, useState } from "react";

const MAX_MB = 20;

interface Props {
  onPhotoSelect: (url: string) => void;
  onFileSelect?: (file: File) => void; // Nayi prop backend ke liye
  onRemove: () => void;
  photoUrl?: string | null;
}

export default function PhotoUpload({ onPhotoSelect, onFileSelect, onRemove, photoUrl }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const currentUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Frees the memory held by the previous photo. */
  const release = () => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
  };

  // free the photo when this component leaves the page
  useEffect(() => release, [],);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the user pick the same file again later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`This photo is too large. Please use one under ${MAX_MB} MB.`);
      return;
    }

    setError(null);
    release();
    currentUrl.current = URL.createObjectURL(file);
    
    // Preview ke liye URL pass karein
    onPhotoSelect(currentUrl.current);
    
    // Backend API ke liye asli File object pass karein
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    release();
    setError(null);
    onRemove();
  };

  if (photoUrl) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-navy/10 px-4 py-2">
        <span className="text-sm font-medium text-navy">
          <span aria-hidden>📸</span> Room photo added
        </span>
        <button
          onClick={handleRemove}
          className="rounded-full border border-navy/30 bg-white px-3 py-1 text-xs font-semibold text-navy transition hover:bg-cream"
        >
          Change photo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-dashed border-navy/30 bg-cream/50 p-8 text-center">
        <div aria-hidden className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-3xl">
          📸
        </div>
        <h3 className="font-serif text-lg text-navy">Upload your room photo</h3>
        <p className="mt-1 text-sm text-ink/60">
          Stand straight on, in a well-lit room, so the floor and walls are clearly visible.
        </p>
        <p className="mt-1 text-xs text-ink/50">Your photo stays on your device and is not uploaded.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-cream shadow transition hover:bg-navy/90"
        >
          <span aria-hidden>📸</span> Take photo
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-navy/30 bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-cream"
        >
          <span aria-hidden>🖼️</span> Choose from gallery
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}