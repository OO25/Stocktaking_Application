import { useEffect, useMemo, useRef, useState } from "react";
import { fetchOutlets } from "../../api/products.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import BranchAssignmentTable from "./components/branchAssignmentTable.jsx";
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

function ManageBranchAssignmentPage() {
  const [assignments, setAssignments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    let cancelled = false;
    // Placeholder until branch assignment endpoints exist.
    setAssignments([]);

    fetchOutlets()
      .then((data) => {
        if (!cancelled) {
          setBranches(data.map((outlet) => outlet.name));
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
  }, []);

  // Reset to page 1 when search or filter changes
  const prevSearch = useRef(debouncedSearch);
  const prevBranch = useRef(branchFilter);
  useEffect(() => {
    if (
      prevSearch.current !== debouncedSearch ||
      prevBranch.current !== branchFilter
    ) {
      prevSearch.current = debouncedSearch;
      prevBranch.current = branchFilter;
      setPage(1);
    }
  }, [debouncedSearch, branchFilter]);

  const filteredAssignments = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return assignments.filter((assignment) => {
      if (branchFilter && assignment.branch !== branchFilter) return false;
      if (!query) return true;
      const haystack = `${assignment.name} ${assignment.branch || ""}`
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [assignments, debouncedSearch, branchFilter]);

  const totalCount = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageAssignments = filteredAssignments.slice(
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
            <h1 className="page-title">Branch Assignment</h1>
            <p className="page-description">
              Assign products or inventories to each branch and track totals.
            </p>
          </div>

          {/* Action */}
          <div className="action-row">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button disabled title="Branch assignment coming soon">
                <Plus />
                New Assignment
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search + branch filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  type="text"
                  placeholder="Search by name or branch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <div className="ml-auto w-full md:w-auto">
                <Select
                  value={branchFilter || "__all__"}
                  onValueChange={(value) =>
                    setBranchFilter(value === "__all__" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-full md:min-w-56 md:w-auto">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__all__">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <BranchAssignmentTable
            loading={loading}
            error={error}
            assignments={pageAssignments}
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

export default ManageBranchAssignmentPage;
