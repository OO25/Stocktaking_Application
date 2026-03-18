import { useState, useEffect } from "react";
import { fetchBranches, createBranch } from "../api/branches.js";

const INITIAL_FORM = {
  name: "",
  branch_number: "",
};

/**
 * Modal for creating a new branch.
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
function AddBranchModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [existingBranches, setExistingBranches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load existing branches for duplicate checking when modal opens
  useEffect(() => {
    if (!open) return;
    fetchBranches().then(setExistingBranches).catch(console.error);
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
    const num = form.branch_number;

    // Check 3-digit format
    if (!/^\d{3}$/.test(num)) {
      errors.branch_number = "Branch number must be exactly 3 digits.";
    }

    // Check for duplicates against existing branches
    const duplicateName = existingBranches.find(
      (b) => b.name.trim().toLowerCase() === trimmedName
    );
    const duplicateNumber = existingBranches.find(
      (b) => String(b.branch_number) === String(num)
    );

    if (duplicateName) errors.name = `"${form.name.trim()}" is already taken.`;
    if (duplicateNumber) errors.branch_number = `Branch number ${num} is already assigned.`;

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await createBranch({
        name: form.name.trim(),
        branch_number: Number(form.branch_number),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create branch.");
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
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Branch</h2>
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

          {/* Branch Name */}
          <div>
            <label className={labelClass}>
              Branch Name <span className="text-red-500">*</span>
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

          {/* Branch Number */}
          <div>
            <label className={labelClass}>
              Branch Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={3}
              value={form.branch_number}
              onChange={(e) => set("branch_number", e.target.value.replace(/\D/g, ""))}
              className={fieldErrors.branch_number ? inputErrorClass : inputClass}
              placeholder="e.g. 042"
            />
            {fieldErrors.branch_number && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.branch_number}</p>
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
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Adding…" : "Add Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBranchModal;