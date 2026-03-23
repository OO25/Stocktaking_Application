import { useState, useEffect } from "react";
import { fetchOutlets, createOutlet } from "../../../api/outlets.js";

const INITIAL_FORM = {
  name: "",
  cost_centre: "",
};

/**
 * Modal for creating a new outlet.
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
function AddOutletModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [existingOutlets, setExistingOutlets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load existing outlets for duplicate checking when modal opens
  useEffect(() => {
    if (!open) return;
    //Added new function to fetch outlets without pagination for duplicate checking (Alex T.)
    fetchOutlets()
      .then((data) => setExistingOutlets(data?.rows || []))
      .catch(console.error);
    setForm(INITIAL_FORM);
    setError(null);
    setFieldErrors({});
  }, [open]);

  if (!open) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear field error as user types
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const errors = {};
    const trimmedName = form.name.trim().toLowerCase();
    const num = form.cost_centre;

    // Check 3-digit format
    if (!/^\d{3}$/.test(num)) {
      errors.cost_centre = "Cost centre must be exactly 3 digits.";
    }

    // Check for duplicates against existing outlets
    const duplicateName = (existingOutlets || []).find(
      (b) => b.name.trim().toLowerCase() === trimmedName
    );
    const duplicateNumber = (existingOutlets || []).find(
      (b) => String(b.cost_centre) === String(num)
    );

    if (duplicateName) errors.name = `"${form.name.trim()}" is already taken.`;
    if (duplicateNumber) errors.cost_centre = `Cost centre ${num} is already assigned.`;

    return errors;
  }

  async function handleSubmit(e) {
    // Debug Test, uncommented 'setError(null)' to allow error messages to show (Alex T.)
    e.preventDefault();
    console.log("Submitting:", form);
    //setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await createOutlet({
        name: form.name.trim(),
        cost_centre: form.cost_centre, //removed 'Number' to intentionally store as integer
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create outlet.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300";
  const inputErrorClass =
    "w-full px-3 py-2 text-sm border border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      //onClick={onClose} // Disasbled clicking outside to close to prevent accidental closure (Alex T.)
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Outlet</h2>
          <button
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Outlet Name */}
          <div>
            <label className={labelClass}>
              Outlet Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={fieldErrors.name ? inputErrorClass : inputClass}
              placeholder="e.g. Auckland City"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Outlet Number */}
          <div>
            <label className={labelClass}>
              Cost Centre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={3}
              value={form.cost_centre}
              onChange={(e) => set("cost_centre", e.target.value.replace(/\D/g, ""))}
              className={fieldErrors.cost_centre ? inputErrorClass : inputClass}
              placeholder="e.g. 042"
            />
            {fieldErrors.cost_centre && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.cost_centre}</p>
            )}
          </div>

          {/* General error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Adding…" : "Add Outlet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



export default AddOutletModal;
