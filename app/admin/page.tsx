"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slot: string;
  price: number;
  unit: string;
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

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  const total = products.length;
  const active = products.filter((p) => p.isActive).length;

  // Count per slot
  const slotCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.slot] = (acc[p.slot] ?? 0) + 1;
    return acc;
  }, {});

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500 text-sm">
          Welcome back! Here&apos;s your product overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total Products"
          value={loading ? "—" : String(total)}
          sub="In database"
          color="amber"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Active Products"
          value={loading ? "—" : String(active)}
          sub="Live on store"
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Categories"
          value={loading ? "—" : String(Object.keys(slotCounts).length)}
          sub="Product types"
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
        <StatCard
          label="Inactive"
          value={loading ? "—" : String(total - active)}
          sub="Hidden from store"
          color="red"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Products by Category */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">By Category</h2>
            <Link href="/admin/products" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : Object.keys(slotCounts).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No products yet. Add your first product!</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(slotCounts).map(([slot, count]) => (
                <div key={slot} className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLOT_COLORS[slot] ?? "bg-slate-100 text-slate-700"}`}>
                    {SLOT_LABELS[slot] ?? slot}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Recently Added</h2>
            <Link href="/admin/products/new" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              + Add new →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 text-4xl">📦</div>
              <p className="text-sm text-slate-500">No products yet</p>
              <Link
                href="/admin/products/new"
                className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition"
              >
                Add First Product
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentProducts.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {SLOT_LABELS[p.slot] ?? p.slot} · £{p.price}/{p.unit}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: "amber" | "green" | "blue" | "red";
  icon: React.ReactNode;
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    red: "bg-red-50 text-red-500 ring-red-100",
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-4 ${colors[color]}`}>
        {icon}
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
