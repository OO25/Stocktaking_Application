import { useEffect, useState } from "react";
import { createUom } from "../../../api/uom.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { cn } from "../../../lib/utils.js";

const INITIAL_FORM = {
  name: "",
  description: "",
};

/** Returns true if the form has been changed from its initial state. */
function isAddUomDirty(form) {
  return form.name !== "" || form.description !== "";
}

/**
 * Modal overlay for creating a new unit of measure.
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
function AddUomModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setError(null);
    setFieldErrors({});
    setDiscardOpen(false);
  }, [open]);

  if (!open) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.description.trim()) errors.description = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const labels = { name: "Name", description: "Description" };
      const missing = Object.keys(errors).map((k) => labels[k] || k).join(", ");
      setError(`Please fill in the following required fields: ${missing}.`);
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createUom({ name: form.name, description: form.description });
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => { 
          console.log('dirty check:', {
            name: form.name !== (user?.name || ''),
            username: form.username !== (user?.username || ''),
            password: form.password !== '',
            role: form.role !== String(user?.role || 'manager').toLowerCase().trim(),
            selectedOutlets,
            userBranchIds: user?.branch_ids,
          });
          if (isAddUomDirty(form)) { setDiscardOpen(true); } else { onClose(); } }}
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
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="add-uom-name" className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="add-uom-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn(inputClass, fieldErrors.name && "border-red-500 focus-visible:ring-red-500")}
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
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={cn(inputClass, fieldErrors.description && "border-red-500 focus-visible:ring-red-500")}
                placeholder="e.g. Kilogram"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Unit"}
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

export default AddUomModal;
