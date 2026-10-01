import { useState, useEffect, useRef } from "react";
import {
  fetchProducts,
  fetchCategories,
  fetchSuppliers,
  fetchOutlets,
  deleteProduct,
} from "../../api/products.js";
import AddProductModal from "./components/AddProductModal.jsx";
import EditProductModal from "./components/EditProductModal.jsx";
import ProductTable from "./components/productTable.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.jsx";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu.jsx";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "az", label: "Alphabetical A–Z" },
  { value: "price_asc", label: "Price: Low to High" },
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

const EMPTY_FILTERS = { type: "", category: "", supplier: "", outlet: "" };

function ManageProductPage() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("az");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

  // Fetch products whenever page, limit, debounced search, filters, or sort changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProducts({
      page,
      limit,
      search: debouncedSearch,
      sort,
      type: filters.type,
      category: filters.category,
      supplier: filters.supplier,
      outlet: filters.outlet,
    })
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
  }, [page, limit, debouncedSearch, filters, sort]);

  async function refreshProducts({ nextPage = page } = {}) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({
        page: nextPage,
        limit,
        search: debouncedSearch,
        sort,
        type: filters.type,
        category: filters.category,
        supplier: filters.supplier,
        outlet: filters.outlet,
      });
      setProducts(data.rows);
      setTotalCount(data.totalCount);
      if (nextPage !== page) setPage(nextPage);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // Pagination is already applied server-side.
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const pageProducts = products;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Count active filters for the badge
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function handleProductCreated() {
    showSuccess("New product has been created.");
    refreshProducts({ nextPage: 1 }).catch(console.error);
  }

  function handleProductUpdated() {
    showSuccess("Product has been updated.");
    refreshProducts().catch(console.error);
  }

  async function handleProductDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      showSuccess("Product has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setDeleteError("");
      refreshProducts().catch(console.error);
    } catch (err) {
      setDeleteError(
        err.message || "Failed to delete product. Please try again.",
      );
      setDeleteDialogOpen(true);
    }
  }

  const labelClass =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline">
                    Options
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4" />
                    Import Products
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Export</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                      onValueChange={(v) =>
                        setFilter("type", v === "__all__" ? "" : v)
                      }
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
                      onValueChange={(v) =>
                        setFilter("category", v === "__all__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className={labelClass}>Supplier</label>
                    <Select
                      value={filters.supplier || "__all__"}
                      onValueChange={(v) =>
                        setFilter("supplier", v === "__all__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Suppliers</SelectItem>
                        {supplierOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Outlet */}
                  <div>
                    <label className={labelClass}>Outlet</label>
                    <Select
                      value={filters.outlet || "__all__"}
                      onValueChange={(v) =>
                        setFilter("outlet", v === "__all__" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Outlets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Outlets</SelectItem>
                        {outletOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
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
                    <button
                      onClick={() => setFilter("type", "")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.category}
                    <button
                      onClick={() => setFilter("category", "")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.supplier && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.supplier}
                    <button
                      onClick={() => setFilter("supplier", "")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.outlet && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {filters.outlet}
                    <button
                      onClick={() => setFilter("outlet", "")}
                      className="ml-1 hover:text-destructive"
                    >
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
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onEdit={(product) => setEditingProduct(product)}
            onDelete={(product) => {
              setDeleteTarget(product);
              setDeleteDialogOpen(true);
            }}
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

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setDeleteTarget(null);
              setDeleteError("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete product</AlertDialogTitle>
              {!deleteError ? (
                <AlertDialogDescription>
                  {`Delete "${deleteTarget?.name || "this product"}"? This action cannot be undone.`}
                </AlertDialogDescription>
              ) : null}
              {deleteError ? (
                <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {deleteError}
                </div>
              ) : null}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {!deleteError ? (
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleProductDeleteConfirm}
                >
                  Delete
                </AlertDialogAction>
              ) : null}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default ManageProductPage;
