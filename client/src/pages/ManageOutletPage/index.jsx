import { useState, useEffect, useRef } from "react";
import { fetchOutlets } from "../../api/outlets.js";
import AddOutletModal from "./components/AddOutletModal.jsx";
import OutletTable from "./components/OutletTable.jsx";
import EditOutletModal from "./components/EditOutletModal.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
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
  Upload,
} from "lucide-react";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedSearch = useDebounce(search, 300);
  const [editingOutlet, setEditingOutlet] = useState(null);

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
  }, [page, limit, debouncedSearch, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  function handleOutletCreated() {
    setReloadKey((prev) => prev + 1); // Trigger refetch in OutletTable
  }

  function handleOutletEdit(outlet) {
    setEditingOutlet(outlet);
  }
// New function to handle outlet deletion (Alex T.)
  function handleOutletDeleted(deletedId, deletedName) {
    setOutlets((prev) => prev.filter((outlet) => outlet.id !== deletedId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setSuccessMessage(`Outlet${deletedName ? ` \"${deletedName}\"` : ""} deleted.`);
    setReloadKey((prev) => prev + 1);
  }

  useEffect(() => {
    if (!successMessage) return undefined;
    const id = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(id);
  }, [successMessage]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">

        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
            <p className="text-sm text-gray-500">Manage your outlets here.</p>
          </div>
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
                  Import Outlets
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
              Add New Outlet
            </Button>
          </div>
        </div>

        {successMessage && <SuccessAlert message={successMessage} />}

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
            onDeleted={handleOutletDeleted} // Pass deletion handler to OutletTable (Alex T.)
            onEdit={handleOutletEdit} // Pass edit handler to OutletTable (Alex T.)
          />
        </div>

        <AddOutletModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={handleOutletCreated}
        />

        <EditOutletModal
          open={!!editingOutlet}
          outlet={editingOutlet}
          onClose={() => setEditingOutlet(null)}
          onUpdated={handleOutletCreated}
        />
      </div>
    </div>
  );
}

export default ManageOutletPage;
