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
import { Badge } from "../../../components/ui/badge.jsx";
import { Box, Pencil, UtensilsCrossed } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Category table for ManageCategoryPage. */
function CategoryTable({
  loading,
  error,
  categories,
  search,
  limit,
  page,
  totalPages,
  onLimitChange,
  onPageChange,
  onEdit,
  onDelete,
  typeFilter,
  onTypeFilterChange,
}) {
  return (
    <Table>
      <TableHeader>
          <TableRow>
            <TableHead className="w-65 py-4 pl-6">Name</TableHead>
            <TableHead className="w-60 py-4">Type</TableHead>
          <TableHead className="w-50 py-4">Created & Updated Dates</TableHead>
          <TableHead className="w-30 py-4">
            <div className="flex justify-end">
              <div className="w-30 text-center">Action</div>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && (
          <TableRow>
            <TableCell colSpan={4} className="py-12 text-center text-sm">
              Loading categories…
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

        {!loading && error === null && categories.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-12 text-center text-sm">
              {search
                ? "No categories match your search."
                : "No categories found."}
            </TableCell>
          </TableRow>
        )}

          {!loading &&
            error === null &&
          categories.map((category) => {
            const CategoryIcon =
              category.type === "Packaging type" ? Box : UtensilsCrossed;
            const allocatedProductCount = Number(
              category.allocated_product_count || 0
            );
            const canDelete = allocatedProductCount === 0;

            return (
              <TableRow key={category.key}>
                <TableCell className="font-semibold pl-6">
                  <div className="flex items-center gap-2">
                    <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-primary-primary">
                      <CategoryIcon className="size-4" />
                    </span>
                    {category.name}
                  </div>
                </TableCell>
              <TableCell className="text-gray-600">
                {category.type ? (
                  <Badge variant="secondary">{category.type}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900 whitespace-nowrap">
                  Created: {formatDateTime(category.created_at)}
                </div>
                <div className="text-sm font-light text-gray-500 whitespace-nowrap">
                  Updated: {formatDateTime(category.updated_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <div className="inline-flex items-center justify-center gap-2 w-30">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit?.(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteButton inUse={!canDelete} onClick={() => onDelete?.(category)} />
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

export default CategoryTable;
