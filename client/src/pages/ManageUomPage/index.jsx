import { sortByName } from "../../lib/sortByName.js";
import NameSortSelect from "../../components/NameSortSelect.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchUoms, deleteUom } from "../../api/uom.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu.jsx";
import UomTable from "./components/uomTable.jsx";
import AddUomModal from "./components/AddUomModal.jsx";
import EditUomModal from "./components/EditUomModal.jsx";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
} from "lucide-react";

/** Debounce a value by `delay` ms. */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ManageUomPage() {
  const [uoms, setUoms] = useState([]);
  const [sort, setSort] = useState("az");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successTimerRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  // Load all UOMs from the API
  function loadUoms() {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUoms()
      .then((data) => {
        if (!cancelled) setUoms(data);
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

  function handleUomCreated() {
    loadUoms();
    showSuccess("New unit has been created.");
  }

  function handleUomUpdated() {
    loadUoms();
    showSuccess("Unit has been updated.");
  }

  async function handleUomDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteUom(deleteTarget.id);
      loadUoms();
      showSuccess("Unit has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete unit.");
    }
  }

  // Load UOMs
  useEffect(() => {
    return loadUoms();
  }, []);

  // Reset to page 1 when search changes
  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      prevSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  const filteredUoms = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return uoms;
    return uoms.filter((uom) => {
      const haystack = `${uom.name} ${uom.description || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [uoms, debouncedSearch]);

  const totalCount = filteredUoms.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageUoms = sortByName(filteredUoms, sort).slice(startIndex, startIndex + limit);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">
        {/* Heading */}
        <div className="intro-row">
          <div>
            <h1 className="page-title">Units of Measure</h1>
            <p className="page-description">
              Keep unit names and descriptions consistent across products.
            </p>
          </div>

          {/* Action */}
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
                Add New Unit
              </Button>
            </div>
          </div>
        </div>

        {/* Success message */}
        <SuccessAlert
          message={successMessage}
          className="fixed bottom-4 right-4 z-50 w-[320px]"
        />

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  id="uom-search"
                  name="search"
                  type="text"
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <NameSortSelect
              value={sort}
              onValueChange={(value) => {
                setSort(value);
                setPage(1);
              }}
            />
          </div>

          <UomTable
            loading={loading}
            error={error}
            uoms={pageUoms}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onEdit={(uom) => setEditingUom(uom)}
            onDelete={(uom) => {
              setDeleteTarget(uom);
              setDeleteDialogOpen(true);
            }}
          />
        </div>

        {/* Add UOM modal */}
        <AddUomModal
          existingUnits={uoms}
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={handleUomCreated}
        />

        {/* Edit UOM modal */}
        <EditUomModal
          existingUnits={uoms}
          open={Boolean(editingUom)}
          uom={editingUom}
          onClose={() => setEditingUom(null)}
          onUpdated={handleUomUpdated}
        />

        {/* Delete confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setDeleteTarget(null);
          }}
          title="Delete unit"
          description={`Delete "${
            deleteTarget?.name || "this unit"
          }"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleUomDeleteConfirm}
        />
      </div>
    </div>
  );
}

export default ManageUomPage;
