import { useEffect, useState } from "react";
import { createUom } from "../../../api/uom.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";

const INITIAL_FORM = {
  name: "",
  description: "",
};

/**
 * Modal overlay for creating a new unit of measure.
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
function AddUomModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset form each time the modal opens
  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setError(null);
  }, [open]);

  if (!open) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createUom({
        name: form.name,
        description: form.description || null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create unit.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Unit</h2>
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
          <div>
            <label htmlFor="add-uom-name" className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="add-uom-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. kg"
            />
          </div>

          <div>
            <label htmlFor="add-uom-description" className={labelClass}>
              Description <span className="text-red-500">*</span>
            </label>
            <Input
              id="add-uom-description"
              name="description"
              type="text"
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
              placeholder="e.g. Kilogram"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add Unit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUomModal;
