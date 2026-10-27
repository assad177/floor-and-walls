"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export interface ProductFormData {
  name: string;
  slot: string;
  price: string;
  unit: string;
  color: string;
  pattern: string;
  image: string;
  isActive: boolean;
}

interface Props {
  initialData?: Partial<ProductFormData>;
  productId?: string; // if editing
}

const SLOTS = [
  { value: "floor", label: "Flooring" },
  { value: "wall", label: "Walls" },
  { value: "ceiling", label: "Ceiling" },
  { value: "curtain", label: "Curtains / Blinds" },
  { value: "joinery", label: "Joinery / Media Wall" },
  { value: "sofa", label: "Sofas" },
  { value: "table", label: "Tables" },
];

const PATTERNS = [
  { value: "", label: "None" },
  { value: "plain", label: "Plain" },
  { value: "plank", label: "Plank (Wood)" },
  { value: "tile", label: "Tile" },
  { value: "panel", label: "Panel / Slat" },
];

const UNITS = [
  { value: "sqm", label: "Per sqm (area-based)" },
  { value: "each", label: "Each (per item)" },
];

const DEFAULT_FORM: ProductFormData = {
  name: "",
  slot: "floor",
  price: "",
  unit: "sqm",
  color: "#C8A06B",
  pattern: "",
  image: "",
  isActive: true,
};

export default function ProductForm({ initialData, productId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = !!productId;

  const [form, setForm] = useState<ProductFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setField("image", data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      setError("Name and price are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          pattern: form.pattern || null,
          image: form.image || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-800 pb-3 border-b border-slate-100">
          Basic Information
        </h2>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Natural Oak Wood Floor"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
          />
        </div>

        {/* Slot + Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Category *
            </label>
            <select
              value={form.slot}
              onChange={(e) => setField("slot", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition bg-white"
            >
              {SLOTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Pricing Unit *
            </label>
            <select
              value={form.unit}
              onChange={(e) => setField("unit", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition bg-white"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price + Pattern */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Price (£) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">£</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Pattern
            </label>
            <select
              value={form.pattern}
              onChange={(e) => setField("pattern", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition bg-white"
            >
              {PATTERNS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-800 pb-3 border-b border-slate-100">
          Appearance
        </h2>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Swatch Color *
          </label>
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-xl border-2 border-slate-200 shadow-sm cursor-pointer overflow-hidden relative"
              style={{ backgroundColor: form.color }}
              onClick={() => document.getElementById("color-input")?.click()}
            >
              <input
                id="color-input"
                type="color"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <div>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                placeholder="#C8A06B"
                className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-400 transition"
              />
              <p className="text-xs text-slate-400 mt-1">Click swatch or enter hex</p>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
            Product Image
          </label>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
              dragOver
                ? "border-amber-400 bg-amber-50"
                : "border-slate-200 hover:border-amber-300 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />

            {form.image ? (
              <div className="p-4 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Image uploaded ✓</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{form.image}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setField("image", ""); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="h-8 w-8 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-slate-500">Uploading…</span>
                  </div>
                ) : (
                  <>
                    <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-semibold text-slate-600">Drop image here or click to upload</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP · Max 5MB</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Product Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {form.isActive ? "Visible in admin DB (not shown on main site yet)" : "Hidden — won't appear even when DB is connected"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setField("isActive", !form.isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isActive ? "bg-amber-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            isEditing ? "Save Changes" : "Add Product"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
