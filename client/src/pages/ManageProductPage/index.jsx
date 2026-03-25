import { useState, useEffect, useRef, useMemo } from "react";
import { fetchProducts, fetchCategories, fetchSuppliers, fetchOutlets, deleteProduct } from "../../api/products.js";
import AddProductModal from "./components/AddProductModal.jsx";
import EditProductModal from "./components/EditProductModal.jsx";
import ProductTable from "./components/productTable.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover.jsx";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest",     label: "Recently Created" },
  { value: "az",         label: "Alphabetical A–Z" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

/** Debounce a value by `delay` ms. */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Sort a list of products by the given sort key. */
function sortProducts(products, sort) {
  const sorted = [...products];
  switch (sort) {
    case "az":
      return sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    case "price_asc":
      return sorted.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    case "price_desc":
      return sorted.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

/** Apply active filters to a list of products. */
function filterProducts(products, filters) {
  return products.filter((p) => {
    // Type filter
    if (filters.type === "food" && p.is_packaging) return false;
    if (filters.type === "packaging" && !p.is_packaging) return false;

    // Category filter (food_group or packaging_type name)
    if (filters.category) {
      const cat = p.is_packaging ? p.packaging_type : p.food_group;
      if (cat !== filters.category) return false;
    }

    // Supplier filter
    if (filters.supplier && p.supplier !== filters.supplier) return false;

    // Outlet filter — product must belong to the selected outlet
    if (filters.outlet) {
      const names = Array.isArray(p.outlet_names) ? p.outlet_names : [];
      if (!names.includes(filters.outlet)) return false;
    }

    return true;
  });
}

const EMPTY_FILTERS = { type: "", category: "", supplier: "", outlet: "" };

function ManageProductPage() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successTimerRef = useRef(null);

  // Dropdown option lists derived from loaded products
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [outletOptions, setOutletOptions] = useState([]);

  const debouncedSearch = useDebounce(search, 300);

  // Load filter option lists once on mount
  useEffect(() => {
    fetchCategories()
      .then((data) => {
        const all = [
          ...data.foodGroups.map((fg) => fg.name),
          ...data.packagingTypes.map((pt) => pt.name),
        ];
        setCategoryOptions([...new Set(all)].sort());
      })
      .catch(console.error);

    fetchSuppliers()
      .then((data) => setSupplierOptions(data.map((s) => s.name).sort()))
      .catch(console.error);

    fetchOutlets()
      .then((data) => setOutletOptions(data.map((o) => o.name).sort()))
      .catch(console.error);
  }, []);

  // Show a success alert for 4 seconds
  function showSuccess(message) {
    setSuccessMessage(message);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccessMessage("");
      successTimerRef.current = null;
    }, 4000);
  }

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  // Reset to page 1 when search changes
  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      prevSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  // Fetch products whenever page, limit, or debounced search changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProducts({ page, limit, search: debouncedSearch })
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
  }, [page, limit, debouncedSearch]);

  // Apply filters then sort
  const processedProducts = useMemo(
    () => sortProducts(filterProducts(products, filters), sort),
    [products, filters, sort]
  );

  // Calculate total pages based on the actual count from the server, not filtered results
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  // For client-side display, slice the processed (filtered+sorted) results
  const pageProducts = processedProducts.slice((page - 1) * limit, page * limit);

  // Count active filters for the badge
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function handleProductCreated() {
    setPage(1);
    showSuccess("New product has been created.");
  }

  function handleProductUpdated() {
    showSuccess("Product has been updated.");
    fetchProducts({ page, limit, search: debouncedSearch })
      .then((data) => { setProducts(data.rows); setTotalCount(data.totalCount); })
      .catch(console.error);
  }

  async function handleProductDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      showSuccess("Product has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchProducts({ page, limit, search: debouncedSearch })
        .then((data) => { setProducts(data.rows); setTotalCount(data.totalCount); })
        .catch(console.error);
    } catch (err) {
      setError(err.message || "Failed to delete product.");
    }
  }

  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

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
          <div className="action-row">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus />
                Add New Item
              </Button>
            </div>
          </div>
        </div>

        {/* Success alert */}
        <SuccessAlert
          message={successMessage}
          className="fixed bottom-4 right-4 z-50 w-[320px]"
        />

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Toolbar: search + filter + sort */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="search-field flex-1 min-w-48">
                <Search className="search-icon" />
                <Input
                  id="product-search"
                  name="search"
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filter popover */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-4 space-y-4">
                  {/* Type */}
                  <div>
                    <label className={labelClass}>Type</label>
                    <Select
                      value={filters.type || "__all__"}
                      onValueChange={(v) => setFilter("type", v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className={labelClass}>Category</label>
                    <Select
                      value={filters.category || "__all__"}
                      onValueChange={(v) => setFilter("category", v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className={labelClass}>Supplier</label>
                    <Select
                      value={filters.supplier || "__all__"}
                      onValueChange={(v) => setFilter("supplier", v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Suppliers</SelectItem>
                        {supplierOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Outlet */}
                  <div>
                    <label className={labelClass}>Outlet</label>
                    <Select
                      value={filters.outlet || "__all__"}
                      onValueChange={(v) => setFilter("outlet", v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Outlets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Outlets</SelectItem>
                        {outletOptions.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear filters */}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-muted-foreground"
                      onClick={clearFilters}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Clear all filters
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              {/* Sort */}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-auto min-w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filter badges */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.type && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.type === "food" ? "Food" : "Packaging"}
                    <button onClick={() => setFilter("type", "")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.category}
                    <button onClick={() => setFilter("category", "")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.supplier && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.supplier}
                    <button onClick={() => setFilter("supplier", "")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.outlet && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.outlet}
                    <button onClick={() => setFilter("outlet", "")} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <ProductTable
            loading={loading}
            error={error}
            products={pageProducts}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onEdit={(product) => setEditingProduct(product)}
            onDelete={(product) => { setDeleteTarget(product); setDeleteDialogOpen(true); }}
          />
        </div>

        <AddProductModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={handleProductCreated}
        />

        <EditProductModal
          open={Boolean(editingProduct)}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdated={handleProductUpdated}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteTarget(null); }}
          title="Delete product"
          description={`Delete "${deleteTarget?.name || "this product"}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleProductDeleteConfirm}
        />
      </div>
    </div>
  );
}

export default ManageProductPage;
