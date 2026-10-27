"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  slot: string;
  price: number;
  unit: string;
  color: string;
  pattern: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
}

const SLOT_LABELS: Record<string, string> = {
  floor: "Flooring",
  wall: "Walls",
  ceiling: "Ceiling",
  curtain: "Curtains",
  joinery: "Joinery",
  sofa: "Sofas",
  table: "Tables",
};

const SLOT_COLORS: Record<string, string> = {
  floor: "bg-amber-100 text-amber-800",
  wall: "bg-blue-100 text-blue-800",
  ceiling: "bg-purple-100 text-purple-800",
  curtain: "bg-pink-100 text-pink-800",
  joinery: "bg-orange-100 text-orange-800",
  sofa: "bg-green-100 text-green-800",
  table: "bg-slate-100 text-slate-700",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterSlot, setFilterSlot] = useState("all");
  const [search, setSearch] = useState("");

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
    );
  }

  const filtered = products
    .filter((p) => filterSlot === "all" || p.slot === filterSlot)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const slots = [...new Set(products.map((p) => p.slot))];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500 text-sm">
            {products.length} products in database
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-200 hover:bg-amber-600 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>

        
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-amber-400 transition w-56"
        />
        <select
          value={filterSlot}
          onChange={(e) => setFilterSlot(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-amber-400 transition"
        >
          <option value="all">All Categories</option>
          {slots.map((s) => (
            <option key={s} value={s}>{SLOT_LABELS[s] ?? s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-slate-500">No products found.</p>
            <Link href="/admin/products/new" className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition">
              Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Color swatch / image */}
                      <div
                        className="h-12 w-12 rounded-xl shrink-0 overflow-hidden border border-slate-200"
                        style={{ backgroundColor: p.color || "#f4f4f5" }}
                      >
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        {p.pattern && (
                          <p className="text-xs text-slate-400 capitalize">{p.pattern} pattern</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SLOT_COLORS[p.slot] ?? "bg-slate-100 text-slate-700"}`}>
                      {SLOT_LABELS[p.slot] ?? p.slot}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-800">
                      £{p.price}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">/{p.unit}</span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 ${
                        p.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.isActive ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deletingId === p.id}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        {deletingId === p.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
