import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchSessionDetail,
  saveSessionEntries,
  submitSession,
} from "../../api/stocktake.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
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

  // Load session detail on mount
  useEffect(() => {
    loadSessionDetail();
  }, [id]);

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

  const isEditable =
    session.status === "draft" || session.status === "in_progress";
  const total = entries.reduce((sum, e) => {
    const product = validProducts.find((p) => p.product_id === e.product_id);
    const unitPrice = product?.unit_price || 0;
    return sum + (e.quantity * unitPrice || 0);
  }, 0);

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
      <div className="mb-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="w-32 text-right">Quantity</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validProducts.map((product) => {
              const entry = entries.find((e) => e.product_id === product.product_id);
              const quantity = entry?.quantity || 0;
              const unitPrice = product.unit_price || 0;
              const lineTotal = quantity * unitPrice;

              return (
                <TableRow key={product.product_id}>
                  <TableCell className="font-medium">
                    {product.product_name}
                  </TableCell>
                  <TableCell>{product.uom_name || "-"}</TableCell>
                  <TableCell>${unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={quantity}
                      onChange={(e) =>
                        updateEntryQuantity(
                          product.product_id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={!isEditable}
                      className="w-28 ml-auto"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${lineTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
                className="bg-green-600 hover:bg-green-700"
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
