import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { Trash } from "lucide-react";

function getStatusColor(status) {
  const colors = {
    draft: "bg-gray-200 text-gray-800",
    in_progress: "bg-blue-200 text-blue-800",
    submitted: "bg-green-200 text-green-800",
    locked: "bg-red-200 text-red-800",
  };
  return colors[status] || "bg-gray-200 text-gray-800";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StockCountTable({
  loading,
  error,
  sessions,
  limit,
  page,
  totalPages,
  onLimitChange,
  onPageChange,
  onDelete,
  emptyMessage = "No stocktake sessions found.",
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-50 py-4 pl-6">Period</TableHead>
          <TableHead className="w-60 py-4">Outlet</TableHead>
          <TableHead className="w-40 py-4">Status</TableHead>
          <TableHead className="w-50 py-4">Counted By</TableHead>
          <TableHead className="w-50 py-4">Counted Date</TableHead>
          <TableHead className="w-40 py-4">
            <div className="flex justify-end">
              <div className="w-32 text-center">Actions</div>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && (
          <TableRow>
            <TableCell colSpan={6} className="py-12 text-center text-sm">
              Loading sessions…
            </TableCell>
          </TableRow>
        )}

        {!loading && error !== null && (
          <TableRow>
            <TableCell colSpan={6} className="py-4">
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                {error}
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading && error === null && sessions.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-12 text-center text-sm">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          error === null &&
          sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-semibold pl-6">
                {session.month}/{session.year}
              </TableCell>
              <TableCell>{session.outlet_name}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(session.status)}>
                  {session.status}
                </Badge>
              </TableCell>
              <TableCell>{session.counted_by || "-"}</TableCell>
              <TableCell>{formatDate(session.counted_date)}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <div className="inline-flex items-center justify-center gap-2 w-32">
                    <Link to={`/stock-count/${session.id}`}>
                      <Button variant="outline" size="sm">
                        {session.status === "draft" ||
                        session.status === "in_progress"
                          ? "Edit"
                          : "View"}
                      </Button>
                    </Link>
                    {session.status === "draft" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete?.(session.id)}
                        aria-label="Delete session"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>
            <div className="flex items-center gap-3 pl-4">
              <span>Rows per page</span>
              <select
                className="border border-gray-200 rounded px-2 py-1 bg-white text-sm"
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="inline-flex items-center gap-3 pr-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                ‹ Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                Next ›
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export default StockCountTable;
