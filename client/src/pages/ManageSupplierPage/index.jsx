import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllSuppliers, deleteSupplier } from "../../api/suppliers.js";
import { Button } from "../../components/ui/button.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import SupplierTable from "./components/supplierTable.jsx";
import AddSupplierModal from "./components/AddSupplierModal.jsx";
import EditSupplierModal from "./components/EditSupplierModal.jsx";
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

function ManageSupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successTimerRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  /*
   * Fetches all suppliers from the API and updates the table
   */
  function loadSuppliers() {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAllSuppliers()
      .then((data) => {
        if (!cancelled) setSuppliers(data);
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

  /*
   * Flashes a success message that auto-dismisses after 4 seconds
   */
  function showSuccess(msg) {
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccessMessage("");
      successTimerRef.current = null;
    }, 4000);
  }

  function handleSupplierCreated() {
    loadSuppliers();
    showSuccess("New supplier has been created.");
  }

  function handleSupplierUpdated() {
    loadSuppliers();
    showSuccess("Supplier has been updated.");
  }

  /*
   * Calls the API to delete the selected supplier, then refreshes the list
   */
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteSupplier(deleteTarget.id);
      loadSuppliers();
      showSuccess("Supplier has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete supplier.");
    }
  }

  useEffect(() => {
    return loadSuppliers();
  }, []);

  // Reset to page 1 when search changes
  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      prevSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  const filteredSuppliers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter((supplier) =>
      String(supplier.name ?? "").toLowerCase().includes(query)
    );
  }, [suppliers, debouncedSearch]);

  const totalCount = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageSuppliers = filteredSuppliers.slice(
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
            <h1 className="page-title">Suppliers</h1>
            <p className="page-description">
              Browse and manage supplier records.
            </p>
          </div>

          {/* Action */}
          <div className="action-row">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus />
                Add New Supplier
              </Button>
            </div>
          </div>
        </div>

        <SuccessAlert
          message={successMessage}
          className="fixed bottom-4 right-4 z-50 w-[320px]"
        />

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  type="text"
                  placeholder="Search by supplier name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>

          <SupplierTable
            loading={loading}
            error={error}
            suppliers={pageSuppliers}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onEdit={(supplier) => setEditingSupplier(supplier)}
            onDelete={(supplier) => {
              setDeleteTarget(supplier);
              setDeleteDialogOpen(true);
            }}
          />
        </div>

        <AddSupplierModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={handleSupplierCreated}
        />

        <EditSupplierModal
          open={Boolean(editingSupplier)}
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onUpdated={handleSupplierUpdated}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setDeleteTarget(null);
          }}
          title="Delete supplier"
          description={`Delete ${
            deleteTarget?.name || "this supplier"
          }? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
}

export default ManageSupplierPage;
