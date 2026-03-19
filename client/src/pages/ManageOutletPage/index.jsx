import { useState, useEffect, useRef } from "react";
import { fetchOutlets } from "../../api/outlets.js";
import AddOutletModal from "../../components/AddOutletModal.jsx";
import OutletTable from "../../components/OutletTable.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Plus, Search } from "lucide-react";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ManageOutletPage() {
  const [outlets, setOutlets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 when search changes
  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      prevSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  // Fetch outlets whenever page, limit, or search changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOutlets({ page, limit, search: debouncedSearch })
      .then((data) => {
        if (!cancelled) {
          setOutlets(data.rows);
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

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  function handleOutletCreated() {
    setPage(1);
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">

        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
            <p className="text-sm text-gray-500">Manage your outlets here.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus />
            Add New Outlet
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          <OutletTable
            loading={loading}
            error={error}
            outlets={outlets}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>

        <AddOutletModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={handleOutletCreated}
        />
      </div>
    </div>
  );
}

export default ManageOutletPage;
