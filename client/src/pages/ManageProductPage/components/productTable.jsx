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
import { Badge } from "../../../components/ui/badge.jsx";
import { Pencil, Trash } from "lucide-react";

/** Shows first outlet with a +N button to reveal the rest. */
function OutletCell({ names }) {
  const [expanded, setExpanded] = useState(false);
  if (!Array.isArray(names) || names.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  const first = names[0];
  const rest = names.slice(1);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant="secondary">{first}</Badge>
      {rest.length > 0 && !expanded && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => setExpanded(true)}
        >
          +{rest.length} more
        </button>
      )}
      {expanded && rest.map((name) => (
        <Badge key={name} variant="secondary">{name}</Badge>
      ))}
      {expanded && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => setExpanded(false)}
        >
          less
        </button>
      )}
    </div>
  );
}

/** Product table for ManageProductPage. */
function ProductTable({
  loading,
  error,
  products,
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
    <div className="">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48 py-4 pl-6">Name</TableHead>
            <TableHead className="w-24 py-4">Price</TableHead>
            <TableHead className="w-32 py-4">Category</TableHead>
            <TableHead className="w-28 py-4">Supplier</TableHead>
            <TableHead className="w-56 py-4">Outlets</TableHead>
            <TableHead className="w-16 text-center py-4">PKG</TableHead>
            <TableHead className="w-16 text-center py-4">UOM</TableHead>
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
              <TableCell colSpan={8} className="py-12 text-center text-sm">
                Loading products…
              </TableCell>
            </TableRow>
          )}

          {!loading && error !== null && (
            <TableRow>
              <TableCell colSpan={8} className="py-4">
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

          {!loading && error === null && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-sm">
                {search ? "No products match your search." : "No products found."}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            error === null &&
            products.map((product) => {
              const category = product.is_packaging
                ? product.packaging_type
                : product.food_group;

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-semibold pl-6">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-left">
                    {product.price != null
                      ? `$${Number(product.price).toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.supplier ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <OutletCell names={product.outlet_names} />
                  </TableCell>
                  <TableCell className="text-center">
                    {product.package_size ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.uom ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <div className="inline-flex items-center justify-center gap-2 w-30">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onEdit?.(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete?.(product)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>
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
            <TableCell colSpan={3} className="text-right">
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
    </div>
  );
}

export default ProductTable;
