import { useState, useEffect, useRef } from "react";
import { fetchProducts, fetchCategories } from "../api/products.js";
import AddProductModal from "../components/AddProductModal.jsx";
import ProductTable from "../components/productTable.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";
import { Plus, Search } from "lucide-react";

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
  const [categories, setCategories] = useState({
    foodGroups: [],
    packagingTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Load categories once on mount
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Reset to page 1 when search or category changes
  const prevSearch = useRef(debouncedSearch);
  const prevCategory = useRef(category);
  useEffect(() => {
    if (
      prevSearch.current !== debouncedSearch ||
      prevCategory.current !== category
    ) {
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

    return () => {
      cancelled = true;
    };
  }, [page, limit, debouncedSearch, category]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  /** Re-fetch current page after a new product is created. */
  function handleProductCreated() {
    setPage(1);
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">
        {/* Heading */}
        <div className="intro-row">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-description">
              Quick access to essential metrics and management tools.
            </p>
          </div>

          {/* Action */}
          <div className="action-row">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus />
                Add New Item
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search + category filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">

              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Category dropdown */}
              <div className="ml-auto w-full md:w-auto">
                <Select
                  value={category || "__all__"}
                  onValueChange={(value) =>
                    setCategory(value === "__all__" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-full md:min-w-56 md:w-auto">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__all__">All Categories</SelectItem>

                    {categories.foodGroups.length > 0 && (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Food Groups</SelectLabel>
                          {categories.foodGroups.map((fg) => (
                            <SelectItem key={`fg-${fg.id}`} value={fg.name}>
                              {fg.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </>
                    )}

                    {categories.packagingTypes.length > 0 && (
                      <>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Packaging</SelectLabel>
                          {categories.packagingTypes.map((pt) => (
                            <SelectItem key={`pt-${pt.id}`} value={pt.name}>
                              {pt.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ProductTable
            loading={loading}
            error={error}
            products={products}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>

        {/* Add product modal */}
        <AddProductModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={handleProductCreated}
        />
      </div>
    </div>
  );
}

/*
 * Hue-based category colours commented out.
 *
 * const CATEGORY_HUES = {
 *   Meat: 0, Poultry: 30, Seafood: 200, Dairy: 50, "Dry Goods": 160,
 *   "Frozen Goods": 210, "Fresh Produce": 120, "Pastry & Bakery": 35,
 *   Alcohol: 270, "Cold Drinks": 195, "Hot Drinks": 15, Confectionery: 320,
 *   Serviettes: 60, "Cups/Lids/Holders": 230, "Container/Noodle Boxes": 140,
 *   Bags: 280, Cleaning: 170, Cutlery: 220, Gloves: 350,
 *   "Consumable & Papers": 90, "Drop-off & Pizza Boxes": 25,
 * };
 *
 * function categoryStyle(name) {
 *   const hue = CATEGORY_HUES[name] ?? 240;
 *   return {
 *     backgroundColor: `hsl(${hue}, 65%, 94%)`,
 *     color: `hsl(${hue}, 55%, 35%)`,
 *     borderColor: `hsl(${hue}, 55%, 80%)`,
 *   };
 * }
 */

export default ManageProductPage;
