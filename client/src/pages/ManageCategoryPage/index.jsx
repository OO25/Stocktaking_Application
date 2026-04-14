import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCategories,
  deleteFoodGroup,
  deletePackagingType,
} from "../../api/categories.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import CategoryTable from "./components/categoryTable.jsx";
import AddCategoryModal from "./components/AddCategoryModal.jsx";
import EditCategoryModal from "./components/EditCategoryModal.jsx";
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

function ManageCategoryPage() {
  const [categoryGroups, setCategoryGroups] = useState({
    foodGroups: [],
    packagingTypes: [],
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successTimerRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  // Load all categories from the API
  function loadCategories() {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategoryGroups(data);
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
  }

  // Show a success message for 4 seconds
  function showSuccess(message) {
    setSuccessMessage(message);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccessMessage("");
      successTimerRef.current = null;
    }, 4000);
  }

  function handleCategoryCreated() {
    loadCategories();
    showSuccess("New category has been created.");
  }

  function handleCategoryUpdated() {
    loadCategories();
    showSuccess("Category has been updated.");
  }

  async function handleCategoryDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      const isFoodGroup = deleteTarget.code !== undefined;
      if (isFoodGroup) {
        await deleteFoodGroup(deleteTarget.id);
      } else {
        await deletePackagingType(deleteTarget.id);
      }
      loadCategories();
      showSuccess("Category has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    }
  }

  // Load categories
  useEffect(() => {
    return loadCategories();
  }, []);

  // Reset to page 1 when search or filter changes
  const prevSearch = useRef(debouncedSearch);
  const prevType = useRef(typeFilter);
  useEffect(() => {
    if (
      prevSearch.current !== debouncedSearch ||
      prevType.current !== typeFilter
    ) {
      prevSearch.current = debouncedSearch;
      prevType.current = typeFilter;
      setPage(1);
    }
  }, [debouncedSearch, typeFilter]);

  const allCategories = useMemo(() => {
    const foodGroups = (categoryGroups.foodGroups || []).map((item) => ({
      id: item.id,
      key: `food-${item.id}`,
      name: item.name,
      code: item.code,
      type: "Food group",
      created_at: item.created_at ?? null,
      updated_at: item.updated_at ?? null,
    }));

    const packagingTypes = (categoryGroups.packagingTypes || []).map((item) => ({
      id: item.id,
      key: `packaging-${item.id}`,
      name: item.name,
      type: "Packaging type",
      created_at: item.created_at ?? null,
      updated_at: item.updated_at ?? null,
    }));

    return [...foodGroups, ...packagingTypes];
  }, [categoryGroups]);

  const filteredCategories = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return allCategories.filter((category) => {
      if (typeFilter === "food" && category.type !== "Food group") return false;
      if (typeFilter === "packing" && category.type !== "Packaging type") return false;
      if (!query) return true;
      const haystack = `${category.name} ${category.type || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [allCategories, debouncedSearch, typeFilter]);

  const totalCount = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageCategories = filteredCategories.slice(
    startIndex,
    startIndex + limit
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">
        {/* Heading */}
        <div className="intro-row">
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-description">
              Organize and maintain food groups and packaging types.
            </p>
          </div>

          {/* Action */}
          <div className="action-row">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus />
                Add New Category
              </Button>
            </div>
          </div>
        </div>

        {/* Success message */}
        <SuccessAlert message={successMessage} />

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search + filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-4">
            <div className="search-field flex-1">
              <Search className="search-icon" />
              <Input
                id="category-search"
                name="search"
                type="text"
                placeholder="Search by name or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="packing">Packing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CategoryTable
            loading={loading}
            error={error}
            categories={pageCategories}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onEdit={(category) => setEditingCategory(category)}
            onDelete={(category) => {
              setDeleteTarget(category);
              setDeleteDialogOpen(true);
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => setTypeFilter(value)}
          />
        </div>
      </div>

      {/* Modals */}
      <AddCategoryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCategoryCreated}
      />

      <EditCategoryModal
        open={editingCategory !== null}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onUpdated={handleCategoryUpdated}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete category?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleCategoryDeleteConfirm}
        confirmVariant="destructive"
      />
    </div>
  );
}

export default ManageCategoryPage;
