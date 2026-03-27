import { useEffect, useState } from "react";
import { fetchSessions, deleteSession } from "../../api/stocktake.js";
import StockCountTable from "./components/stockcountTable.jsx";

/*
 * Displays list of all stocktake sessions for the user
 */
export default function StockCountPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [previousPage, setPreviousPage] = useState(1);
  const [previousLimit, setPreviousLimit] = useState(10);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  // Delete a session
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }
    try {
      await deleteSession(id);
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete session");
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentSessions = sessions.filter(
    (session) =>
      Number(session.month) === currentMonth &&
      Number(session.year) === currentYear
  );
  const previousSessions = sessions.filter(
    (session) =>
      Number(session.month) !== currentMonth ||
      Number(session.year) !== currentYear
  );

  const totalCount = currentSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageSessions = currentSessions.slice(startIndex, startIndex + limit);

  const previousTotalCount = previousSessions.length;
  const previousTotalPages = Math.max(
    1,
    Math.ceil(previousTotalCount / previousLimit)
  );
  const previousStartIndex = (previousPage - 1) * previousLimit;
  const previousPageSessions = previousSessions.slice(
    previousStartIndex,
    previousStartIndex + previousLimit
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (previousPage > previousTotalPages) {
      setPreviousPage(previousTotalPages);
    }
  }, [previousPage, previousTotalPages]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Stock Count</h1>
          <p className="mt-1 text-gray-600">
            View and manage stocktake sessions
          </p>
        </div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Current Month Stocktakes
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <StockCountTable
              loading={loading}
              error={error}
              sessions={pageSessions}
              limit={limit}
              page={page}
              totalPages={totalPages}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              onPageChange={(nextPage) => setPage(nextPage)}
              onDelete={handleDelete}
              emptyMessage="No stocktake sessions found for this month."
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Previous Stocktakes
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <StockCountTable
              loading={loading}
              error={error}
              sessions={previousPageSessions}
              limit={previousLimit}
              page={previousPage}
              totalPages={previousTotalPages}
              onLimitChange={(nextLimit) => {
                setPreviousLimit(nextLimit);
                setPreviousPage(1);
              }}
              onPageChange={(nextPage) => setPreviousPage(nextPage)}
              onDelete={handleDelete}
              emptyMessage="No previous stocktake sessions found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
