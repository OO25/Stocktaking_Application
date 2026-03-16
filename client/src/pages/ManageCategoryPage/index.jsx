import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCategories } from "../../api/products.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import CategoryTable from "./components/categoryTable.jsx";
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
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
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
      key: `food-${item.id}`,
      name: item.name,
      type: "Food group",
      created_at: item.created_at ?? null,
      updated_at: item.updated_at ?? null,
    }));

    const packagingTypes = (categoryGroups.packagingTypes || []).map((item) => ({
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
      if (typeFilter && category.type !== typeFilter) return false;
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
              <Button disabled title="Category creation coming soon">
                <Plus />
                Add New Category
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search + type filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
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
              <div className="ml-auto w-full md:w-auto">
                <Select
                  name="type"
                  value={typeFilter || "__all__"}
                  onValueChange={(value) =>
                    setTypeFilter(value === "__all__" ? "" : value)
                  }
                >
                  <SelectTrigger id="category-type-filter" className="w-full md:min-w-56 md:w-auto">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__all__">All Types</SelectItem>
                    <SelectItem value="Food group">Food group</SelectItem>
                    <SelectItem value="Packaging type">Packaging type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          />
        </div>
      </div>
    </div>
  );
}

export default ManageCategoryPage;
