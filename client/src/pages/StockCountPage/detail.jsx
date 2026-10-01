import { useAuth } from "../../context/AuthContext.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PackageIcon,
  Save,
  SendHorizonal,
} from "lucide-react";
import {
  deleteSessionTemporaryItem,
  fetchSessionDetail,
  saveSessionEntries,
  updateSessionStatus,
} from "../../api/stocktake.js";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
import { Input } from "../../components/ui/input.jsx";
import StockCountProductTable from "./components/stockcountProductTable.jsx";
import AddTemporaryItemModule from "./components/addTemporaryItemModule.jsx";
import TemporaryItemsTable from "./components/temporaryItemsTable.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog.jsx";

/*
 * Allows user to edit and submit a stocktake session
 */
export default function StockCountDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [validProducts, setValidProducts] = useState([]);
  const [temporaryItems, setTemporaryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [addTemporaryItemOpen, setAddTemporaryItemOpen] = useState(false);
  const [unrecognizedDialogOpen, setUnrecognizedDialogOpen] = useState(false);
  const [editingTemporaryItem, setEditingTemporaryItem] = useState(null);
  const [temporaryItemDefaults, setTemporaryItemDefaults] = useState(null);
  const [scanProduct, setScanProduct] = useState(null);
  const [scanQuantity, setScanQuantity] = useState("");
  // Barcode scanners type very fast so capture those keystrokes in a buffer.
  const scanBufferRef = useRef("");
  // Tracks time between keys to ignore slower, human typing.
  const scanLastKeyRef = useRef(0);
  const pendingNavigationRef = useRef(null);
  const scanInputRef = useRef(null);
  const isEditable =
    ["admin", "manager"].includes(user?.role) &&
    (session?.status === "draft" || session?.status === "in_progress");
  const [savedEntriesSnapshot, setSavedEntriesSnapshot] = useState("[]");

  const normalizeEntries = (items = []) =>
    JSON.stringify(
      [...items]
        .map((entry) => ({
          product_id: Number(entry.product_id),
          quantity: Number(entry.quantity || 0),
          unit_price: Number(entry.unit_price || 0),
        }))
        .sort((a, b) => a.product_id - b.product_id),
    );

  const normalizeValidProduct = (product) => ({
    ...product,
    barcode:
      product?.barcode ??
      product?.product_code ??
      product?.productCode ??
      product?.code ??
      "",
    uom_name:
      product?.uom_name ??
      product?.uom ??
      product?.uomName ??
      product?.unit_of_measure ??
      product?.unit ??
      "",
  });

  const hasUnsavedChanges =
    isEditable && normalizeEntries(entries) !== savedEntriesSnapshot;

  // Load session detail on mount
  useEffect(() => {
    loadSessionDetail();
  }, [id]);

  useEffect(() => {
    if (!session?.assignment_name) return;
    const sessionId = String(id);
    sessionStorage.setItem(`stockcount-name:${sessionId}`, session.assignment_name);
    window.dispatchEvent(
      new CustomEvent("stockcount-name", {
        detail: { id: sessionId, name: session.assignment_name },
      })
    );
  }, [id, session]);

  const loadSessionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching session detail for ID:", id);
      const data = await fetchSessionDetail(id);
      console.log("Session data received:", data);
      setSession(data);
      setValidProducts((data.valid_products || []).map(normalizeValidProduct));
      setEntries(data.current_entries || []);
      setSavedEntriesSnapshot(normalizeEntries(data.current_entries || []));
      setTemporaryItems(data.temporary_items || []);
    } catch (err) {
      console.error("Error loading session:", err);
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the quantity for a product in the current session.
   * Preserves any existing unit_price, falling back to the current catalogue
   * price when creating a new entry.
   */
  const updateEntryQuantity = (productId, quantity) => {
    setEntries((prev) => {
      // Find existing entry for this product
      const existing = prev.find((e) => e.product_id === productId);
      // Get the product details including its unit price
      const product = validProducts.find((p) => p.product_id === productId);
      const existingUnitPrice = Number(existing?.unit_price);
      const productUnitPrice = Number(product?.unit_price);
      const resolvedUnitPrice = Number.isFinite(existingUnitPrice)
        ? existingUnitPrice
        : Number.isFinite(productUnitPrice)
          ? productUnitPrice
          : 0;
      // Coerce quantity to number and validate it's not NaN
      const numericQuantity = parseFloat(quantity) || 0;
      
      if (existing) {
        // Update existing entry, PRESERVING unit_price to prevent total calc errors
        return prev.map((e) =>
          e.product_id === productId
            ? { ...e, quantity: numericQuantity, unit_price: resolvedUnitPrice }
            : e
        );
      }
      // Create new entry with product_id, quantity, and unit_price
      return [
        ...prev,
        {
          product_id: productId,
          quantity: numericQuantity,
          unit_price: resolvedUnitPrice,
        },
      ];
    });
  };

  function handleScanSave(nextQuantity) {
    if (!scanProduct) return;
    const rawValue =
      nextQuantity ?? scanInputRef.current?.value ?? scanQuantity ?? 0;
    const parsed = Number(rawValue || 0);
    updateEntryQuantity(scanProduct.product_id, parsed);
    setScanDialogOpen(false);
    setScanProduct(null);
  }

  useEffect(() => {
    if (!scanDialogOpen || !scanProduct) return;
    const existing = entries.find((e) => e.product_id === scanProduct.product_id);
    const existingQty = existing?.quantity ?? 0;
    setScanQuantity(String(existingQty));
    requestAnimationFrame(() => scanInputRef.current?.focus());
  }, [entries, scanDialogOpen, scanProduct]);

  // Listen for fast key sequences (barcode scans) while the session is editable.
  useEffect(() => {
    if (!isEditable) return undefined;

    function finalizeScan() {
      const raw = scanBufferRef.current.trim();
      scanBufferRef.current = "";
      if (!raw) return;
      // Match exact barcode from the scanned buffer.
      const match = validProducts.find((product) =>
        String(product.barcode ?? product.product_code ?? "").trim() === raw
      );
      if (!match) {
        setTemporaryItemDefaults({ barcode: raw });
        setUnrecognizedDialogOpen(true);
        return;
      }
      setScanProduct(match);
      setScanDialogOpen(true);
    }

    function handleKeyDown(event) {
      if (scanDialogOpen || unrecognizedDialogOpen || addTemporaryItemOpen) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Enter") {
        if (scanBufferRef.current) {
          event.preventDefault();
          finalizeScan();
        }
        return;
      }

      if (event.key.length !== 1) return;

      const now = Date.now();
      const last = scanLastKeyRef.current;
      // If typing is slow (more than 200ms between keys), reset the buffer to avoid false barcode matches.
      if (last && now - last > 200) {
        scanBufferRef.current = "";
      }
      scanLastKeyRef.current = now;
      scanBufferRef.current += event.key;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditable, scanDialogOpen, validProducts, unrecognizedDialogOpen, addTemporaryItemOpen]);

  // Save entries without finalizing
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const result = await saveSessionEntries(id, entries, false);
      setSession((prev) => ({ ...prev, status: result.status }));
      // Reload to get updated data
      await loadSessionDetail();
      return true;
    } catch (err) {
      setError(err.message || "Failed to save entries");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const requestNavigation = (to) => {
    if (!hasUnsavedChanges || saving || submitting) {
      navigate(to);
      return;
    }
    pendingNavigationRef.current = { to };
    setLeaveDialogOpen(true);
  };

  const handleConfirmLeaveWithoutSaving = () => {
    const pending = pendingNavigationRef.current;
    setLeaveDialogOpen(false);
    pendingNavigationRef.current = null;
    if (!pending?.to) return;
    navigate(pending.to);
  };

  const handleConfirmSaveAndLeave = async () => {
    const pending = pendingNavigationRef.current;
    const saved = await handleSave();
    if (!saved) return;
    setLeaveDialogOpen(false);
    pendingNavigationRef.current = null;
    if (!pending?.to) return;
    navigate(pending.to);
  };

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleDocumentClick = (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!link) return;
      if (link.getAttribute("target") === "_blank") return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(href, window.location.origin);
      const currentUrl = new URL(window.location.href);

      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      const currentPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

      if (nextPath === currentPath) return;
      if (nextUrl.origin !== currentUrl.origin) return;

      event.preventDefault();
      pendingNavigationRef.current = { to: nextPath };
      setLeaveDialogOpen(true);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [hasUnsavedChanges]);

  const formatCountedDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date).replace(/(\d+ \w+) (\d+)/, "$1, $2");
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "submitted":
        return {
          dot: "bg-green-800",
          text: "text-green-800",
        };
      case "in_progress":
        return {
          dot: "bg-blue-800",
          text: "text-blue-800",
        };
      case "draft":
      default:
        return {
          dot: "bg-gray-800",
          text: "text-gray-800",
        };
    }
  };

  const formatStatus = (status) => status?.replace(/_/g, " ") || "-";

  const formatPeriodDueDate = (month, year) => {
    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (!numericMonth || !numericYear) return "-";

    return formatCountedDate(new Date(numericYear, numericMonth, 0));
  };

  /**
   * Saves and finalizes the stocktake session.
   * Sets counted_date and marks session as submitted in one operation.
   * Includes proper error handling and timing to prevent race conditions.
   */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Save entries with finalize flag: this sets status to "submitted" and counted_date
      // No separate submitSession() call needed - finalize flag handles submission
      const saveResult = await saveSessionEntries(id, entries, true);
      if (!saveResult || !saveResult.success) {
        throw new Error("Failed to finalize session");
      }
      
      setSavedEntriesSnapshot(normalizeEntries(entries));
      setSession((previous) => ({ ...previous, status: saveResult.status }));
      navigate("/stock-count");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit session");
    } finally {
      setSubmitting(false);
    }
  };

  async function handleReopen() {
    try {
      setSaving(true);
      setError(null);
      await updateSessionStatus(id, "in_progress");
      setReopenDialogOpen(false);
      await loadSessionDetail();
    } catch (err) {
      setError(err.message || "Failed to reopen stocktake.");
    } finally {
      setSaving(false);
    }
  }

  const handleDeleteTemporaryItem = async (itemId) => {
    try {
      setError(null);
      await deleteSessionTemporaryItem(id, itemId);
      await loadSessionDetail();
    } catch (err) {
      setError(err.message || "Failed to delete temporary item");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <button
          onClick={() => loadSessionDetail()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Session not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const total = entries.reduce((sum, entry) => {
    const product = validProducts.find(
      (p) => p.product_id === entry.product_id,
    );
    const unitPrice = Number(
      entry.unit_price ?? product?.unit_price ?? 0,
    );
    return sum + (entry.quantity * unitPrice || 0);
  }, 0) + temporaryItems.reduce((sum, item) => {
    const lineTotal = Number(item.total ?? (item.quantity * item.price) ?? 0);
    return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);

  const scanEntry = scanProduct
    ? entries.find((e) => e.product_id === scanProduct.product_id)
    : null;
  const scanUnitPrice = scanEntry
    ? Number(scanEntry.unit_price || 0)
    : Number(scanProduct?.unit_price || 0);
  const scanTotal =
    scanProduct && scanQuantity !== ""
      ? Number(scanQuantity || 0) * scanUnitPrice
      : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Count</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Header */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(320px,1.8fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 md:col-span-2 xl:col-span-2">
          <p className="text-lg font-semibold text-gray-900">
            {session.outlet_name} - Period {session.period_month}/
            {session.period_year}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>Counted By: {session.counted_by || "-"}</span>
            <span className="text-gray-300">|</span>
            <Badge
              className={`gap-1.5 bg-muted ${getStatusStyles(session.status).text}`}
            >
              <span
                className={`size-2 rounded-full ${getStatusStyles(session.status).dot}`}
              />
              {formatStatus(session.status)}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-light text-gray-500">
            Last updated: {formatCountedDate(session.counted_date)}
          </p>
          <p className="mt-1 text-sm font-light text-gray-500">
            Due date:{" "}
            {formatPeriodDueDate(session.period_month, session.period_year)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 md:col-span-1 xl:col-span-1">
          <p className="text-sm font-medium text-gray-600">Total Products</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {validProducts.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 md:col-span-1 xl:col-span-1">
          <p className="text-sm font-medium text-gray-600">Total Value</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${total.toFixed(2)}
          </p>
        </div>

        <div className="grid gap-4 md:col-span-2 xl:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4 flex gap-2 items-center">
            <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-primary-primary">
              <PackageIcon className="size-4" />
            </span>
            <p className="text-sm font-medium text-gray-600">Add Item</p>
            <Button
              type="button"
              className="xl:ml-auto"
              onClick={() => {
                setEditingTemporaryItem(null);
                setTemporaryItemDefaults(null);
                setAddTemporaryItemOpen(true);
              }}
              disabled={!isEditable}
            >
              Add Product +
            </Button>
          </div>
        </div>
      </div>

      <TemporaryItemsTable
        temporaryItems={temporaryItems}
        isEditable={isEditable}
        onEdit={(item) => {
          setEditingTemporaryItem(item);
          setTemporaryItemDefaults(null);
          setAddTemporaryItemOpen(true);
        }}
        onDelete={handleDeleteTemporaryItem}
      />

      {/* Products Table */}
      <div>
        <StockCountProductTable
          validProducts={validProducts}
          entries={entries}
          isEditable={isEditable}
          onUpdate={updateEntryQuantity}
          onOpenCount={(product) => {
            if (!isEditable) return;
            const normalized =
              validProducts.find((p) => p.product_id === product.product_id) ||
              normalizeValidProduct(product);
            setScanProduct(normalized);
            setScanDialogOpen(true);
          }}
        />
      </div>

      <div className="sticky bottom-0 z-10 rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <p className="text-sm font-medium text-gray-600">
          {isEditable ? "Save or submit stocktake" : "Stocktake actions"}
        </p>
        {isEditable ? (
          <>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || submitting}
              >
                {saving ? "Saving..." : "Save"}
                <Save />
              </Button>
              <Button
                type="button"
                className='bg-green-600/10 text-green-600 hover:bg-green-600/20 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:hover:bg-green-400/20 dark:focus-visible:ring-green-400/40'
                onClick={() => setSubmitDialogOpen(true)}
                disabled={saving || submitting}
              >
                {submitting ? "Finalizing..." : "Submit"}
                <SendHorizonal />
              </Button>
            </div>

            <AlertDialog
              open={submitDialogOpen}
              onOpenChange={setSubmitDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Stocktake?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit this stocktake? Once
                    submitted, an administrator must reopen it before it can be edited.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction
                  onClick={() => {
                    setSubmitDialogOpen(false);
                    handleSubmit();
                  }}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? "Submitting..." : "Yes, Submit"}
                </AlertDialogAction>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="ml-auto flex gap-2">
            {user?.role === "admin" && (
              <Button variant="outline" onClick={() => setReopenDialogOpen(true)} disabled={saving}>
                {saving ? "Reopening..." : "Reopen stocktake"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => requestNavigation("/stock-count")}
            >
              Back to List
              <ArrowLeft />
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={reopenDialogOpen}
        onOpenChange={setReopenDialogOpen}
        title="Reopen stocktake?"
        description="Reopening allows the assigned outlet to correct and resubmit this stocktake. Existing counts will be retained."
        confirmLabel="Reopen"
        confirmVariant="default"
        onConfirm={handleReopen}
      />

      <AddTemporaryItemModule
        open={addTemporaryItemOpen}
        onClose={() => {
          setAddTemporaryItemOpen(false);
          setEditingTemporaryItem(null);
          setTemporaryItemDefaults(null);
        }}
        sessionId={id}
        temporaryItem={editingTemporaryItem}
        initialValues={temporaryItemDefaults}
        onCreated={() => {
          loadSessionDetail();
          setError(null);
        }}
      />

      <AlertDialog
        open={unrecognizedDialogOpen}
        onOpenChange={setUnrecognizedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Product Not Recognised</AlertDialogTitle>
            <AlertDialogDescription>
              This barcode is not in the current product list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => {
                setUnrecognizedDialogOpen(false);
                setEditingTemporaryItem(null);
                setAddTemporaryItemOpen(true);
              }}
            >
              Add Product
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={scanDialogOpen}
        onOpenChange={(open) => {
          setScanDialogOpen(open);
          if (!open) setScanProduct(null);
        }}
      >
        <AlertDialogContent
          onKeyDownCapture={(event) => {
            if (event.key === "Enter" && scanProduct) {
              event.preventDefault();
              handleScanSave(scanInputRef.current?.value);
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Quantity</AlertDialogTitle>
          </AlertDialogHeader>
          {scanProduct ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <div className="flex flex-col gap-1.5">
                  <div className="text-base font-semibold text-gray-900">
                    {scanProduct.product_name}
                  </div>
                  <div className="text-gray-500">
                    Barcode: {scanProduct.barcode || scanProduct.product_code || "-"}
                  </div>
                  <div className="text-gray-600">
                    UOM: {scanProduct.uom_name || scanProduct.uom || "-"}
                  </div>
                  <div className="text-gray-600">
                    Unit price: ${scanUnitPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <Input
                  ref={scanInputRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={scanQuantity}
                  onChange={(event) => setScanQuantity(event.target.value)}
                  onFocus={(event) => event.target.select()}
                  onKeyDownCapture={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleScanSave(event.currentTarget.value);
                    }
                  }}
                />
                <div className="text-sm text-gray-500">
                  Total: ${scanTotal.toFixed(2)}
                </div>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {scanProduct ? (
              <Button type="button" onClick={() => handleScanSave()}>
                Save
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes before leaving?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved quantity changes in this stock count.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={handleConfirmLeaveWithoutSaving}
              disabled={saving || submitting}
            >
              Leave Without Saving
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSaveAndLeave}
              disabled={saving || submitting}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
