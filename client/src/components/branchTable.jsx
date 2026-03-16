import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table.jsx";
import { Button } from "./ui/button.jsx";
import { Pencil, Trash } from "lucide-react";

function BranchTable({
  loading,
  error,
  branches,
  search,
  limit,
  page,
  totalPages,
  onLimitChange,
  onPageChange,
}) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] py-4 pl-6">Number</TableHead>
            <TableHead className="py-4">Name</TableHead>
            <TableHead className="py-4">
              <div className="flex justify-end">
                <div className="w-[120px] text-center">Action</div>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-sm">
                Loading branches…
              </TableCell>
            </TableRow>
          )}

          {!loading && error !== null && (
            <TableRow>
              <TableCell colSpan={3} className="py-4">
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              </TableCell>
            </TableRow>
          )}

          {!loading && error === null && branches.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-12 text-center text-sm">
                {search ? "No branches match your search." : "No branches found."}
              </TableCell>
            </TableRow>
          )}

          {!loading && error === null && branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell className="pl-6 font-mono">
                {String(branch.branch_number).padStart(3, "0")}
              </TableCell>
              <TableCell className="font-semibold">{branch.name}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <div className="inline-flex items-center justify-center gap-2 w-[120px]">
                    <Button size="sm" variant="secondary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={1}>
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
            <TableCell colSpan={2} className="text-right">
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
    </div>
  );
}

export default BranchTable;