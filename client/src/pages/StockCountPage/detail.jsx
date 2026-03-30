import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchSessionDetail,
  saveSessionEntries,
  submitSession,
} from "../../api/stocktake.js";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
import { Input } from "../../components/ui/input.jsx";
import StockCountProductTable from "./components/stockcountProductTable.jsx";
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
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [validProducts, setValidProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanProduct, setScanProduct] = useState(null);
  const [scanQuantity, setScanQuantity] = useState("");
  // Barcode scanners type very fast so capture those keystrokes in a buffer.
  const scanBufferRef = useRef("");
  // Tracks time between keys to ignore slower, human typing.
  const scanLastKeyRef = useRef(0);
  const scanInputRef = useRef(null);
  const isEditable =
    session?.status === "draft" || session?.status === "in_progress";

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
      setValidProducts(data.valid_products || []);
      setEntries(data.current_entries || []);
    } catch (err) {
      console.error("Error loading session:", err);
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  // Update quantity for an entry
  const updateEntryQuantity = (productId, quantity) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.product_id === productId);
      const product = validProducts.find((p) => p.product_id === productId);
      const unitPrice = product?.unit_price || 0;
      
      if (existing) {
        return prev.map((e) =>
          e.product_id === productId ? { ...e, quantity } : e
        );
      }
      return [...prev, { product_id: productId, quantity, unit_price: unitPrice }];
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
        String(product.barcode || "").trim() === raw
      );
      if (!match) return;
      setScanProduct(match);
      setScanDialogOpen(true);
    }

    function handleKeyDown(event) {
      if (scanDialogOpen) return;
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
  }, [isEditable, scanDialogOpen, validProducts]);

  // Save entries without finalizing
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const result = await saveSessionEntries(id, entries, false);
      setSession((prev) => ({ ...prev, status: result.status }));
      // Reload to get updated data
      await loadSessionDetail();
    } catch (err) {
      setError(err.message || "Failed to save entries");
    } finally {
      setSaving(false);
    }
  };

  // Submit session
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      // Save entries with finalize flag
      const saveResult = await saveSessionEntries(id, entries, true);
      // Then submit
      await submitSession(id);
      // Reload and redirect
      await loadSessionDetail();
      // Show success and redirect
      setTimeout(() => {
        navigate("/stock-count");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit session");
    } finally {
      setSubmitting(false);
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

  const total = entries.reduce((sum, e) => {
    const product = validProducts.find((p) => p.product_id === e.product_id);
    const unitPrice = product?.unit_price || 0;
    return sum + (e.quantity * unitPrice || 0);
  }, 0);

  const scanUnitPrice = scanProduct ? Number(scanProduct.unit_price || 0) : 0;
  const scanTotal =
    scanProduct && scanQuantity !== ""
      ? Number(scanQuantity || 0) * scanUnitPrice
      : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Count</h1>
        <p className="mt-1 text-gray-600">
          Period {session.period_month}/{session.period_year} - {session.outlet_name}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Header */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <Badge className="mt-2">{session.status}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Counted By</p>
            <p className="mt-2 text-gray-900">{session.counted_by || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Counted Date</p>
            <p className="mt-2 text-gray-900">{session.counted_date || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Value</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              ${total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <StockCountProductTable
        validProducts={validProducts}
        entries={entries}
        isEditable={isEditable}
        onUpdate={updateEntryQuantity}
        onOpenCount={(product) => {
          if (!isEditable) return;
          setScanProduct(product);
          setScanDialogOpen(true);
        }}
      />

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
                    Barcode: {scanProduct.barcode || "-"}
                  </div>
                  <div className="text-gray-600">
                    UOM: {scanProduct.uom_name || "-"}
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
                  onFocus={() => setScanQuantity("")}
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

      {/* Actions */}
      {isEditable && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/stock-count")}
            disabled={saving || submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className=""
                disabled={saving || submitting}
              >
                {submitting ? "Finalizing..." : "Finalize & Submit"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Stocktake?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to submit this stocktake? Once submitted,
                  it cannot be edited.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogAction
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </AlertDialogAction>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {!isEditable && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/stock-count")}
          >
            Back to List
          </Button>
        </div>
      )}
    </div>
  );
}
