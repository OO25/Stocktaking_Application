import { useEffect, useState } from "react";
import { createSession } from "../../../api/stocktake.js";
import { fetchOutlets } from "../../../api/products.js";
import { Button } from "../../../components/ui/button.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { cn } from "../../../lib/utils.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function currentMonth() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/*
 * Modal for creating a stocktake assignment — pick a month/year and outlet
 */
function CreateAssignmentModal({ open, onClose, onCreated }) {
  const { month: defaultMonth, year: defaultYear } = currentMonth();
  const [month, setMonth] = useState(String(defaultMonth));
  const [year, setYear] = useState(String(defaultYear));
  const [outletId, setOutletId] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [outletError, setOutletError] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const { month: m, year: y } = currentMonth();
    setMonth(String(m));
    setYear(String(y));
    setOutletId("");
    setError(null);
    setOutletError(false);
    setDiscardOpen(false);
    fetchOutlets().then(setOutlets).catch(() => setOutlets([]));
  }, [open]);

  if (!open) return null;

  const yearOptions = [];
  for (let y = new Date().getFullYear() + 1; y >= 2020; y--) {
    yearOptions.push(y);
  }

  function isDirty() {
    const { month: m, year: y } = currentMonth();
    return outletId !== "" || String(month) !== String(m) || String(year) !== String(y);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!outletId) {
      setOutletError(true);
      setError("Please fill in the following required fields: Outlet.");
      return;
    }

    setSubmitting(true);
    try {
      await createSession({
        month: Number(month),
        year: Number(year),
        outlet_id: Number(outletId),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => { if (isDirty()) { setDiscardOpen(true); } else { onClose(); } }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">New Stocktake Assignment</h2>
            <button
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="assign-month" className={labelClass}>
                  Month <span className="text-red-500">*</span>
                </label>
                <Select name="month" value={month} onValueChange={setMonth}>
                  <SelectTrigger id="assign-month" className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="assign-year" className={labelClass}>
                  Year <span className="text-red-500">*</span>
                </label>
                <Select name="year" value={year} onValueChange={setYear}>
                  <SelectTrigger id="assign-year" className="w-full">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="assign-outlet" className={labelClass}>
                Outlet <span className="text-red-500">*</span>
              </label>
              <Select
                name="outlet_id"
                value={outletId}
                onValueChange={(v) => { setOutletId(v); setOutletError(false); }}
              >
                <SelectTrigger
                  id="assign-outlet"
                  className={cn("w-full", outletError && "border-red-500 focus:ring-red-500")}
                >
                  <SelectValue placeholder="Select an outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={String(outlet.id)}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Assignment"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Are you sure you want to discard your changes?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={onClose}
      />
    </>
  );
}

export default CreateAssignmentModal;
