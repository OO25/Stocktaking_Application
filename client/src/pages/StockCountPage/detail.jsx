import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchSessionDetail,
  saveSessionEntries,
  submitSession,
} from "../../api/stocktake.js";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
import StockCountProductTable from "./components/stockcountProductTable.jsx";
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

  /**
   * Updates the quantity for a product in the current session.
   * When updating an existing entry, preserves the unit_price to ensure
   * correct total calculations. When creating a new entry, fetches unit_price
   * from the valid products list.
   */
  const updateEntryQuantity = (productId, quantity) => {
    setEntries((prev) => {
      // Find existing entry for this product
      const existing = prev.find((e) => e.product_id === productId);
      // Get the product details including its unit price
      const product = validProducts.find((p) => p.product_id === productId);
      const unitPrice = product?.unit_price || 0;
      // Coerce quantity to number and validate it's not NaN
      const numericQuantity = parseFloat(quantity) || 0;
      
      if (existing) {
        // Update existing entry, PRESERVING unit_price to prevent total calc errors
        return prev.map((e) =>
          e.product_id === productId
            ? { ...e, quantity: numericQuantity, unit_price: unitPrice }
            : e
        );
      }
      // Create new entry with product_id, quantity, and unit_price
      return [
        ...prev,
        { product_id: productId, quantity: numericQuantity, unit_price: unitPrice },
      ];
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
      
      // Wait a small delay to ensure database transaction is committed
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Reload session detail to fetch updated counted_date and status from server
      await loadSessionDetail();
      
      // Show success and redirect after data is loaded
      setTimeout(() => {
        navigate("/stock-count");
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
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
      <StockCountProductTable
        validProducts={validProducts}
        entries={entries}
        isEditable={isEditable}
        onUpdate={updateEntryQuantity}
      />

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
