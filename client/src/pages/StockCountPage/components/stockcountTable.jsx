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
import { ClipboardListIcon } from "lucide-react";

function getStatusColor(status) {
  const colors = {
    draft: "text-gray-800",
    in_progress: "text-blue-800",
    submitted: "text-green-800",
    locked: "text-red-800",
  };
  return colors[status] || "text-gray-800";
}

function getStatusDotColor(status) {
  const colors = {
    draft: "bg-gray-800",
    in_progress: "bg-blue-800",
    submitted: "bg-green-800",
    locked: "bg-red-800",
  };
  return colors[status] || "bg-gray-800";
}

function formatStatus(status) {
  return status?.replace(/_/g, " ") || "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formattedDate}, ${formattedTime}`;
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
          <TableHead className="w-80 py-4 pl-6">Outlet</TableHead>
          <TableHead className="w-64 py-4">Counted By</TableHead>
          <TableHead className="w-40 py-4">Status</TableHead>
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
            <TableCell colSpan={4} className="py-12 text-center text-sm">
              Loading sessions…
            </TableCell>
          </TableRow>
        )}

        {!loading && error !== null && (
          <TableRow>
            <TableCell colSpan={4} className="py-4">
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
            <TableCell colSpan={4} className="py-12 text-center text-sm">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          error === null &&
          sessions.map((session) => {
            const isEditable =
              session.status === "draft" || session.status === "in_progress";

            return (
              <TableRow key={session.id}>
                <TableCell className="font-semibold pl-6">
                  <div className="flex items-center gap-2">
                    <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-primary-primary">
                      <ClipboardListIcon className="size-4" />
                    </span>
                    <div>
                      <div>{session.outlet_name}</div>
                      <div className="text-sm font-light text-gray-500">
                        Period {session.month}/{session.year}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{session.counted_by || "-"}</div>
                  <div className="text-sm font-light text-gray-500">
                    Updated at {formatDateTime(session.counted_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`gap-1.5 bg-muted ${getStatusColor(session.status)}`}
                  >
                    <span
                      className={`size-2 rounded-full ${getStatusDotColor(session.status)}`}
                    />
                    {formatStatus(session.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <div className="inline-flex items-center justify-center gap-2 w-32">
                      <Link
                        to={`/stock-count/${session.id}`}
                        state={{
                          assignmentName:
                            session.name || session.assignment_name || "",
                        }}
                      >
                        <Button
                          size="sm"
                          variant={isEditable ? "default" : "outline"}
                        >
                          {isEditable ? "Edit" : "View"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>
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
