import { useState, useEffect } from "react";
import { fetchProducts } from "../api/products.js";

function ManageProductPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null = no error; string = error message

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const category = p.is_packaging ? p.packaging_type : p.food_group;
    return (
      p.name.toLowerCase().includes(term) ||
      (category ?? "").toLowerCase().includes(term) ||
      (p.supplier ?? "").toLowerCase().includes(term) ||
      (p.product_code ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Manage Product</h1>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 w-52"
            />
          </div>

          {/* Add Product button */}
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 py-6">
        {loading && (
          <p className="text-sm text-gray-400 text-center py-12">Loading products…</p>
        )}

        {error !== null && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {!loading && error === null && (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-12">
                {search ? "No products match your search." : "No products found."}
              </p>
            )}
            {filtered.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product }) {
  const category = product.is_packaging ? product.packaging_type : product.food_group;

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm gap-4">
      {/* Product name + inline edit icon */}
      <div className="flex items-center gap-2 w-64 flex-shrink-0">
        <span className="text-sm font-medium text-gray-800">{product.name}</span>
        <button
          className="text-gray-400 hover:text-brand-600 transition-colors flex-shrink-0"
          aria-label={`Edit ${product.name}`}
        >
          <PencilIcon />
        </button>
      </div>

      {/* Meta: supplier · product code · price */}
      <div className="flex-1 flex items-center gap-4 text-sm text-gray-500 min-w-0">
        {product.supplier && (
          <span className="truncate">{product.supplier}</span>
        )}
        {product.product_code && (
          <span className="text-gray-400 font-mono text-xs flex-shrink-0">{product.product_code}</span>
        )}
        {product.price != null && (
          <span className="flex-shrink-0">${Number(product.price).toFixed(2)}</span>
        )}
      </div>

      {/* Category & UOM badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {category && (
          <span className="px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            {category}
          </span>
        )}
        {product.uom && (
          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200">
            {product.uom}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
          Edit
        </button>
        <button className="px-4 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
      />
    </svg>
  );
}

export default ManageProductPage;
