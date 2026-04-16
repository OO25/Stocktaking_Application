import { Clock3, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";

function parseTemporaryDescription(value) {
  if (!value) {
    return {
      productName: "-",
      packageSize: "-",
      unitSize: "-",
    };
  }

  const [productName = "-", packageSize = "-", unitSize = "-"] =
    String(value).split(" | ");

  return {
    productName,
    packageSize,
    unitSize,
  };
}

function TemporaryItemsTable({
  temporaryItems,
  isEditable,
  onEdit,
  onDelete,
}) {
  if (!temporaryItems?.length) return null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Temporary Items</h2>
        <p className="mt-1 text-sm text-gray-500">
          These items belong only to this stocktaking session.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-120 py-4 pl-6">Product</TableHead>
            <TableHead className="w-40 py-4">PKG & UOM</TableHead>
            <TableHead className="w-44 py-4 text-left">
              Unit & Total Price
            </TableHead>
            <TableHead className="w-32 py-4 text-left">Quantity</TableHead>
            <TableHead className="w-32 py-4 text-center pr-6">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {temporaryItems.map((item) => {
            const parsed = parseTemporaryDescription(item.description);
            const productName = item.name || parsed.productName;
            const packageSize =
              item.package_size == null
                ? parsed.packageSize
                : Number(item.package_size).toFixed(2);
            const unitSize = item.uom_name || parsed.unitSize;
            return (
              <TableRow key={item.id}>
                <TableCell className="font-semibold pl-6">
                  <div className="flex items-center gap-2">
                    <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
                      <Clock3 className="size-4" />
                    </span>
                    <div>
                      <div>{productName}</div>
                      <div className="text-sm font-light text-gray-500">
                        {item.food_group_name || "-"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-gray-700">
                      {packageSize || "-"}
                    </div>
                    <div className="text-sm font-light text-gray-500">
                      {unitSize || "-"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="font-semibold">
                    ${Number(item.total || 0).toFixed(2)}
                  </div>
                  <div className="text-sm font-light text-gray-500">
                    Unit: ${Number(item.price || 0).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  {Number(item.quantity || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right pr-6">
                  {isEditable ? (
                    <div className="inline-flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit?.(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete?.(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default TemporaryItemsTable;
