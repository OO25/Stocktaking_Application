import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchOutlets } from "../../api/products.js";
import { fetchSessions, deleteSession } from "../../api/stocktake.js";
import { Button } from "../../components/ui/button.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import BranchAssignmentTable from "./components/branchAssignmentTable.jsx";
import CreateAssignmentModal from "./components/CreateAssignmentModal.jsx";
import { Plus, Search } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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

function ManageBranchAssignmentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [sessions, setSessions] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const successTimerRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  /*
   * Fetches all stocktake sessions from the API and updates the table
   */
  function loadSessions() {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSessions()
      .then((data) => {
        if (!cancelled) setSessions(data);
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

  function handleAssignmentCreated() {
    loadSessions();
    showSuccess("Stocktake assignment created.");
  }

  /*
   * Calls the API to delete the selected session, then refreshes the list
   */
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteSession(deleteTarget.id);
      loadSessions();
      showSuccess("Assignment has been deleted.");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete assignment.");
    }
  }

  useEffect(() => {
    return loadSessions();
  }, []);

  useEffect(() => {
    fetchOutlets().then(setOutlets).catch(() => setOutlets([]));
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

  const filteredSessions = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return sessions.filter((s) => {
      if (branchFilter && String(s.outlet_id) !== branchFilter) return false;
      if (!query) return true;
      const label = `${MONTH_NAMES[(s.month || 1) - 1]} ${s.year} ${s.outlet_name || ""}`.toLowerCase();
      return label.includes(query);
    });
  }, [sessions, debouncedSearch, branchFilter]);

  const totalCount = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageSessions = filteredSessions.slice(startIndex, startIndex + limit);

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
              Create and assign monthly stocktake sessions to branches.
            </p>
          </div>

          {/* Action — only admin can create */}
          {isAdmin && (
            <div className="action-row">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus />
                  New Assignment
                </Button>
              </div>
            </div>
          )}
        </div>

        <SuccessAlert
          message={successMessage}
          className="fixed bottom-4 right-4 z-50 w-[320px]"
        />

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search + branch filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  id="assignment-search"
                  name="search"
                  type="text"
                  placeholder="Search by period or branch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <div className="ml-auto w-full md:w-auto">
                <Select
                  name="branch"
                  value={branchFilter || "__all__"}
                  onValueChange={(value) =>
                    setBranchFilter(value === "__all__" ? "" : value)
                  }
                >
                  <SelectTrigger id="assignment-branch-filter" className="w-full md:min-w-56 md:w-auto">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__all__">All Branches</SelectItem>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={String(outlet.id)}>
                        {outlet.name}
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
            sessions={pageSessions}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            isAdmin={isAdmin}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
            onDelete={(session) => {
              setDeleteTarget(session);
              setDeleteDialogOpen(true);
            }}
          />
        </div>

        <CreateAssignmentModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleAssignmentCreated}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setDeleteTarget(null);
          }}
          title="Delete assignment"
          description={`Delete this stocktake assignment for ${
            deleteTarget?.outlet_name || "this branch"
          }? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
}

export default ManageBranchAssignmentPage;
