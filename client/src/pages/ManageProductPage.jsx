import { useState, useEffect, useRef } from "react";
import { fetchProducts, fetchCategories } from "../api/products.js";

/** Debounce a value by `delay` ms. */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ManageProductPage() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState({ foodGroups: [], packagingTypes: [] });
  const [catOpen, setCatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const catRef = useRef(null);
  const debouncedSearch = useDebounce(search, 300);

  // Load categories once on mount
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset to page 1 when search or category changes
  const prevSearch = useRef(debouncedSearch);
  const prevCategory = useRef(category);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch || prevCategory.current !== category) {
      prevSearch.current = debouncedSearch;
      prevCategory.current = category;
      setPage(1);
    }
  }, [debouncedSearch, category]);

  // Fetch products whenever page, limit, debounced search, or category changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProducts({ page, limit, search: debouncedSearch, category })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.rows);
          setTotalCount(data.totalCount);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, debouncedSearch, category]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <nav className="text-sm text-gray-500 mb-2">Home &gt; Products</nav>
            <h1 className="text-3xl font-extrabold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quick access to essential metrics and management tools.
            </p>
          </div>

          <div className="mt-1">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 pb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search + category filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-full max-w-xl"
                />
              </div>

              {/* Category dropdown */}
              <div className="ml-auto" ref={catRef}>
                <div className="relative inline-block">
                  <button
                    className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setCatOpen((o) => !o)}
                  >
                    {category || "All Categories"}
                    <svg
                      className={`w-4 h-4 inline-block ml-2 transition-transform ${catOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {catOpen && (
                    <div className="absolute right-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          category === "" ? "font-semibold text-blue-600 bg-blue-50" : "text-gray-700"
                        }`}
                        onClick={() => { setCategory(""); setCatOpen(false); }}
                      >
                        All Categories
                      </button>

                      {categories.foodGroups.length > 0 && (
                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100">
                          Food Groups
                        </div>
                      )}
                      {categories.foodGroups.map((fg) => (
                        <button
                          key={`fg-${fg.id}`}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            category === fg.name ? "font-semibold text-blue-600 bg-blue-50" : "text-gray-700"
                          }`}
                          onClick={() => { setCategory(fg.name); setCatOpen(false); }}
                        >
                          {fg.name}
                        </button>
                      ))}

                      {categories.packagingTypes.length > 0 && (
                        <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100">
                          Packaging
                        </div>
                      )}
                      {categories.packagingTypes.map((pt) => (
                        <button
                          key={`pt-${pt.id}`}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            category === pt.name ? "font-semibold text-blue-600 bg-blue-50" : "text-gray-700"
                          }`}
                          onClick={() => { setCategory(pt.name); setCatOpen(false); }}
                        >
                          {pt.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table headings */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs text-gray-500 border-b border-gray-100 items-center">
            <div className="col-span-2">Category</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-1 text-right">Price</div>
            <div className="col-span-2">Supplier</div>
            <div className="col-span-1 text-center">Pkg</div>
            <div className="col-span-1 text-center">UOM</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table rows — only this section re-renders on loading */}
          <div className="space-y-2 px-5 py-4">
            {loading && (
              <p className="text-sm text-gray-400 text-center py-12">
                Loading products…
              </p>
            )}

            {!loading && error !== null && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                {error}
              </div>
            )}

            {!loading && error === null && products.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-12">
                {search
                  ? "No products match your search."
                  : "No products found."}
              </p>
            )}

            {!loading && error === null && products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>

          {/* Footer / pagination */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <span>Rows per page</span>
              <select
                className="border border-gray-200 rounded px-2 py-1 bg-white text-sm"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hue assigned to each category name.
 * All badges share the same saturation (65%) and lightness (95% bg / 35% text),
 * only the hue changes
 */
const CATEGORY_HUES = {
  // Food groups
  Meat: 0,
  Poultry: 30,
  Seafood: 200,
  Dairy: 50,
  "Dry Goods": 160,
  "Frozen Goods": 210,
  "Fresh Produce": 120,
  "Pastry & Bakery": 35,
  Alcohol: 270,
  "Cold Drinks": 195,
  "Hot Drinks": 15,
  Confectionery: 320,
  // Packaging types
  Serviettes: 60,
  "Cups/Lids/Holders": 230,
  "Container/Noodle Boxes": 140,
  Bags: 280,
  Cleaning: 170,
  Cutlery: 220,
  Gloves: 350,
  "Consumable & Papers": 90,
  "Drop-off & Pizza Boxes": 25,
};

/** Returns inline styles for a category badge, varying only the hue. */
function categoryStyle(name) {
  const hue = CATEGORY_HUES[name] ?? 240;
  return {
    backgroundColor: `hsl(${hue}, 65%, 94%)`,
    color: `hsl(${hue}, 55%, 35%)`,
    borderColor: `hsl(${hue}, 55%, 80%)`,
  };
}

/** Single product row within the table grid. */
function ProductRow({ product }) {
  const category = product.is_packaging
    ? product.packaging_type
    : product.food_group;

  return (
    <div className="grid grid-cols-12 gap-4 items-center bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="col-span-2">
        {category && (
          <span
            className="px-3 py-1 text-xs font-medium rounded-full border"
            style={categoryStyle(category)}
          >
            {category}
          </span>
        )}
      </div>

      <div className="col-span-3">
        <div className="text-sm font-semibold text-gray-800 truncate">
          {product.name}
        </div>
      </div>

      <div className="col-span-1 text-right text-sm text-gray-700">
        {product.price != null ? `$${Number(product.price).toFixed(2)}` : "—"}
      </div>

      <div className="col-span-2">
        <div className="inline-block px-2.5 py-1 text-sm bg-gray-100 text-gray-600 rounded-md border border-gray-200">
          {product.supplier ?? "—"}
        </div>
      </div>

      <div className="col-span-1 text-center text-sm text-gray-700">
        {product.pack_size ?? 1}
      </div>

      <div className="col-span-1 text-center">
        {product.uom && (
          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200">
            {product.uom}
          </span>
        )}
      </div>

      <div className="col-span-2 flex items-center justify-end gap-3">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
          Edit
        </button>
        <button className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ManageProductPage;
