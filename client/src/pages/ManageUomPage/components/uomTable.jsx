import DeleteButton from "../../../components/DeleteButton.jsx";
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
import { Pencil, Ruler } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

/** UOM table for ManageUomPage. */
function UomTable({
  loading,
  error,
  uoms,
  search,
  limit,
  page,
  totalPages,
  onLimitChange,
  onPageChange,
  onEdit,
  onDelete,
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-65 py-4 pl-6">Name</TableHead>
          <TableHead className="w-55 py-4">	Created & Updated Dates</TableHead>
          <TableHead className="w-40 py-4">
            <div className="flex justify-end">
              <div className="w-30 text-center">Action</div>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && (
          <TableRow>
            <TableCell colSpan={3} className="py-12 text-center text-sm">
              Loading units…
            </TableCell>
          </TableRow>
        )}

        {!loading && error !== null && (
          <TableRow>
            <TableCell colSpan={3} className="py-4">
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

        {!loading && error === null && uoms.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="py-12 text-center text-sm">
              {search ? "No units match your search." : "No units found."}
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          error === null &&
          uoms.map((uom) => {
            const allocatedProductCount = Number(uom.allocated_product_count || 0);
            const canDelete = allocatedProductCount === 0;
            return (
              <TableRow key={uom.id ?? uom.name}>
                <TableCell className="pl-6">
                  <div className="flex items-start gap-2">
                    <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-primary">
                      <Ruler className="size-4" />
                    </span>
                    <div className="space-y-1">
                      <div className="font-semibold">{uom.name}</div>
                      <div className="text-sm text-gray-500">
                        {uom.description || "—"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm text-gray-900">
                    <div>Created: {formatDate(uom.created_at)}</div>
                    <div>Updated: {formatDate(uom.updated_at)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <div className="inline-flex items-center justify-center gap-2 w-30">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit?.(uom)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteButton inUse={!canDelete} onClick={() => onDelete?.(uom)} />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>
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

export default UomTable;
