"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "../../_components/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<null | Record<string, unknown>>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.products ?? []).find(
          (p: Record<string, unknown>) => p.id === id
        );
        if (!found) setNotFound(true);
        else setProduct(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-40 rounded bg-slate-100 animate-pulse mb-4" />
        <div className="h-10 w-64 rounded-xl bg-slate-100 animate-pulse mb-8" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Product not found.</p>
        <Link href="/admin/products" className="mt-4 inline-block text-sm text-amber-600 hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-slate-400 hover:text-slate-600 transition">
          ← Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Edit: {String(product?.name ?? "")}
        </h1>
        <p className="mt-1 text-slate-500 text-sm">Update product details below.</p>
      </div>

      <ProductForm
        productId={id}
        initialData={{
          name: String(product?.name ?? ""),
          slot: String(product?.slot ?? "floor"),
          price: String(product?.price ?? ""),
          unit: String(product?.unit ?? "sqm"),
          color: String(product?.color ?? "#C8A06B"),
          pattern: String(product?.pattern ?? ""),
          image: String(product?.image ?? ""),
          isActive: Boolean(product?.isActive ?? true),
        }}
      />
    </div>
  );
}
