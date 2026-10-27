import Link from "next/link";
import ProductForm from "../_components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-slate-400 hover:text-slate-600 transition">
          ← Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Add New Product</h1>
        <p className="mt-1 text-slate-500 text-sm">Fill in the details to add a product to the database.</p>
      </div>

      <ProductForm />
    </div>
  );
}
