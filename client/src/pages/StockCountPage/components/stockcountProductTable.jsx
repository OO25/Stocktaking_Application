import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Box, Search, UtensilsCrossed } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs.jsx";
import { Badge } from "../../../components/ui/badge.jsx";

function StockCountProductTable({
  validProducts,
  entries,
  isEditable,
  onUpdate,
  onOpenCount,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const tabCounts = useMemo(() => {
    const counts = {
      all: validProducts.length,
      uncounted: 0,
      counted: 0,
      count0: 0,
    };

    validProducts.forEach((product) => {
      const entry = entries.find(
        (e) => e.product_id === product.product_id
      );
      const quantity = entry?.quantity;
      if (!entry) counts.uncounted += 1;
      if (entry && quantity > 0) counts.counted += 1;
      if (entry && quantity === 0) counts.count0 += 1;
    });

    return counts;
  }, [entries, validProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return validProducts.filter((product) => {
      // Filter by search term: product name or barcode (product_code)
      if (query) {
        // Search across both product name and product_code (barcode)
        // Using includes() for fuzzy matching on product name and barcode
        const haystack = `${product.product_name} ${product.barcode || ""}`
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      
      // Filter by tab: all, uncounted, counted, or count0
      const entry = entries.find(
        (e) => e.product_id === product.product_id
      );
      const quantity = entry?.quantity;
      switch (activeTab) {
        case "uncounted":
          return !entry;
        case "counted":
          return entry && quantity > 0;
        case "count0":
          return entry && quantity === 0;
        case "all":
        default:
          return true;
      }
    });
  }, [activeTab, entries, search, validProducts]);

  const totalCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageProducts = filteredProducts.slice(startIndex, startIndex + limit);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="search-field flex-1 min-w-48 sm:min-w-64 md:min-w-80 ">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="gap-0 self-start lg:ml-auto lg:self-center"
          >
            <TabsList className="bg-transparent p-0 h-10 items-center gap-2">
              <TabsTrigger value="all" className="flex items-center gap-1 border border-gray-200 data-[state=active]:bg-muted">
                All
                <Badge className="h-5 min-w-5 px-1 tabular-nums">
                  {tabCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="uncounted" className="flex items-center gap-1 border border-gray-200 data-[state=active]:bg-muted">
                Uncounted
                <Badge className="h-5 min-w-5 px-1 tabular-nums">
                  {tabCounts.uncounted}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="counted" className="flex items-center gap-1 border border-gray-200 data-[state=active]:bg-muted">
                Counted
                <Badge className="h-5 min-w-5 px-1 tabular-nums">
                  {tabCounts.counted}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="count0" className="flex items-center gap-1 border border-gray-200 data-[state=active]:bg-muted">
                Count 0
                <Badge className="h-5 min-w-5 px-1 tabular-nums">
                  {tabCounts.count0}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" />
            <TabsContent value="uncounted" />
            <TabsContent value="counted" />
            <TabsContent value="count0" />
          </Tabs>
          
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-120 py-4 pl-6">Product</TableHead>
            <TableHead className="w-32 py-4">UOM</TableHead>
            <TableHead className="w-44 py-4 text-left">
              Unit & Total Price
            </TableHead>
            <TableHead className="w-32 py-4 text-left">Quantity</TableHead>
            <TableHead className="w-20 py-4 text-left pr-6">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-sm">
                No products to show.
              </TableCell>
            </TableRow>
          )}
          {pageProducts.map((product) => {
            const entry = entries.find(
              (e) => e.product_id === product.product_id
            );
            const quantity = entry?.quantity || 0;
            const unitPrice = parseFloat(product.unit_price) || 0;
            const lineTotal = quantity * unitPrice;
            const ProductIcon = product.is_packaging ? Box : UtensilsCrossed;

            return (
              <TableRow key={product.product_id}>
                <TableCell className="font-semibold pl-6">
                  <div className="flex items-center gap-2">
                    <span className="flex aspect-square size-12 items-center justify-center rounded-lg bg-muted text-primary-primary">
                      <ProductIcon className="size-5 text-muted-foreground" />
                    </span>
                    <div>
                      <div>{product.product_name}</div>
                      {product.category_name ? (
                        <div className="text-sm font-light text-gray-500">
                          {product.category_name}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-muted text-gray-600 hover:bg-muted">
                    {product.uom_name || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <div className="font-semibold">${lineTotal.toFixed(2)}</div>
                  <div className="text-sm font-light text-gray-500">
                    Unit: ${unitPrice.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) =>
                      onUpdate(
                        product.product_id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={!isEditable}
                    className="w-28 text-left"
                  />
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!isEditable}
                    onClick={() => onOpenCount?.(product)}
                  >
                    Count
                  </Button>
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
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
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
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  ‹ Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
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

export default StockCountProductTable;
