import ModalBackdrop from "../../components/ModalBackdrop.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchOutlets } from "../../api/products.js";
import {
  fetchSessions,
  deleteSession,
  updateSessionStatus,
} from "../../api/stocktake.js";
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
import OutletAssignmentTable from "./components/outletAssignmentTable.jsx";
import CreateAssignmentModal from "./components/CreateAssignmentModal.jsx";
import { Plus, Search } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

function ManageOutletAssignmentPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [sessions, setSessions] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [search, setSearch] = useState("");
  const [outletFilter, setOutletFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState("in_progress");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
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

  function handleAssignmentCreated(createdSession) {
    if (createdSession) {
      setSessions((prev) => {
        if (prev.some((s) => s.id === createdSession.id)) return prev;
        return [createdSession, ...prev];
      });
    } else {
      loadSessions();
    }
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

  async function handleEditStatus(session) {
    if (!session) return;

    setStatusTarget(session);
    setNextStatus(
      ["draft", "in_progress", "submitted", "locked"].includes(session.status)
        ? session.status
        : "draft"
    );
    setStatusDialogOpen(true);
  }

  async function handleStatusUpdateConfirm(event) {
    event?.preventDefault();
    if (!statusTarget) return;

    setStatusSubmitting(true);
    try {
      await updateSessionStatus(statusTarget.id, nextStatus);
      setSessions((prev) =>
        prev.map((item) =>
          item.id === statusTarget.id ? { ...item, status: nextStatus } : item
        )
      );
      setStatusDialogOpen(false);
      setStatusTarget(null);
      showSuccess("Assignment status has been updated.");
    } catch (err) {
      setError(err.message || "Failed to update assignment status.");
    } finally {
      setStatusSubmitting(false);
    }
  }

  function closeStatusDialog() {
    setStatusDialogOpen(false);
    setStatusTarget(null);
  }

  function formatPeriod(month, year) {
    const monthName = MONTH_SHORT_NAMES[(Number(month) || 1) - 1] || "-";
    return `${monthName} ${year || ""}`.trim();
  }

  useEffect(() => {
    return loadSessions();
  }, []);

  useEffect(() => {
    fetchOutlets().then(setOutlets).catch(() => setOutlets([]));
  }, []);

  // Reset to page 1 when search or filter changes
  const prevSearch = useRef(debouncedSearch);
  const prevOutlet = useRef(outletFilter);
  useEffect(() => {
    if (
      prevSearch.current !== debouncedSearch ||
      prevOutlet.current !== outletFilter
    ) {
      prevSearch.current = debouncedSearch;
      prevOutlet.current = outletFilter;
      setPage(1);
    }
  }, [debouncedSearch, outletFilter]);

  const filteredSessions = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return sessions.filter((s) => {
      if (outletFilter && String(s.outlet_id) !== outletFilter) return false;
      if (!query) return true;
      const label = `${MONTH_NAMES[(s.month || 1) - 1]} ${s.year} ${s.outlet_name || ""}`.toLowerCase();
      return label.includes(query);
    });
  }, [sessions, debouncedSearch, outletFilter]);

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
            <h1 className="page-title">Outlet Assignment</h1>
            <p className="page-description">
              Create and assign monthly stocktake sessions to outlets.
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
          {/* Card header: search + outlet filter */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  id="assignment-search"
                  name="search"
                  type="text"
                  placeholder="Search by period or outlet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <div className="ml-auto w-full md:w-auto">
                <Select
                  name="outlet"
                  value={outletFilter || "__all__"}
                  onValueChange={(value) =>
                    setOutletFilter(value === "__all__" ? "" : value)
                  }
                >
                  <SelectTrigger id="assignment-outlet-filter" className="w-full md:min-w-56 md:w-auto">
                    <SelectValue placeholder="All Outlets" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="__all__">All Outlets</SelectItem>
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

          <OutletAssignmentTable
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
            onEditStatus={handleEditStatus}
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
            deleteTarget?.outlet_name || "this outlet"
          }? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
        />

        {statusDialogOpen && statusTarget ? (
          <ModalBackdrop
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={closeStatusDialog}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Edit Assignment Status
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {statusTarget.outlet_name || "Outlet"} -{" "}
                    {formatPeriod(statusTarget.month, statusTarget.year)}
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={closeStatusDialog}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleStatusUpdateConfirm}
                className="px-6 py-5 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select value={nextStatus} onValueChange={setNextStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="submitted">Completed</SelectItem>
                      <SelectItem value="locked">Locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeStatusDialog}
                    disabled={statusSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={statusSubmitting}>
                    {statusSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </ModalBackdrop>
        ) : null}
      </div>
    </div>
  );
}

export default ManageOutletAssignmentPage;
