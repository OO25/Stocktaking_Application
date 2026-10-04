import DeleteButton from "../../../components/DeleteButton.jsx";
import { useState } from "react";
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
import { Pencil, StoreIcon } from "lucide-react";
import { deleteOutlet } from "@/api/outlets.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog.jsx";
import { Badge } from "../../../components/ui/badge.jsx";

function formatDateTime(value) {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";
  return date.toLocaleString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function OutletTable({
  loading,
  error,
  outlets,
  search,
  limit,
  page,
  totalPages,
  onLimitChange,
  onPageChange,
  onDeleted,
  onEdit = () => {},
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    try {
      await deleteOutlet(deleteTarget.id);
      onDeleted?.(deleteTarget.id, deleteTarget?.name);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setDeleteError("");
    } catch (err) {
      setDeleteError(
        err?.message || "Failed to delete outlet. Please try again.",
      );
      setDeleteDialogOpen(true);
    }
  }

  function handleEdit(outlet) {
    onEdit?.(outlet);
  }
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px] py-4 pl-6 pr-6">Name</TableHead>
            <TableHead className="w-[130px] py-4 pr-20">Cost Centre</TableHead>
            <TableHead className="min-w-[190px] py-4 pr-6">Created & Updated Dates</TableHead>
            <TableHead className="w-[160px] py-4">
              <div className="flex justify-end">
                <div className="w-[120px] text-center">Action</div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-sm">
                Loading outlets…
              </TableCell>
            </TableRow>
          )}

          {!loading && error !== null && (
            <TableRow>
              <TableCell colSpan={4} className="py-4">
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              </TableCell>
            </TableRow>
          )}

          {!loading && error === null && outlets.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-sm">
                {search ? "No outlets match your search." : "No outlets found."}
              </TableCell>
            </TableRow>
          )}

          {!loading && error === null && outlets.map((outlet) => {
            const allocatedProductCount = Number(outlet.allocated_product_count || 0);
            const canDelete = allocatedProductCount === 0;
            return (
            <TableRow key={outlet.id}>
              <TableCell className="pl-6 pr-6 font-semibold">
                <div className="flex items-center gap-2">
                  <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-primary-primary">
                    <StoreIcon className="size-4" />
                  </span>
                  {outlet.name}
                </div>
              </TableCell>
              <TableCell className="pr-20">
                <Badge variant="secondary">
                  {String(outlet.cost_centre).padStart(3, "0")}
                </Badge>
              </TableCell>
              <TableCell className="pr-6 text-sm whitespace-nowrap">
                <div className="text-gray-700">
                  Created: {formatDateTime(outlet.created_at)}
                </div>
                <div className="font-light text-gray-500">
                  Updated: {formatDateTime(outlet.updated_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <div className="inline-flex items-center justify-center gap-2 w-[120px]">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(outlet)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteButton
                      inUse={!canDelete}
                      onClick={() => {
                        setDeleteTarget(outlet);
                        setDeleteError("");
                        setDeleteDialogOpen(true);
                      }}
                    />
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
                <span className="text-sm">Rows per page</span>
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
            <TableCell colSpan={1} className="text-right">
              <div className="inline-flex items-center gap-3 pr-4">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                  ‹ Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
                  Next ›
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete outlet</AlertDialogTitle>
            {!deleteError ? (
              <AlertDialogDescription>
                {`Delete "${deleteTarget?.name || "this outlet"}"? This action cannot be undone.`}
              </AlertDialogDescription>
            ) : null}
            {deleteError ? (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {deleteError}
              </div>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError ? (
              <AlertDialogAction
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OutletTable;
