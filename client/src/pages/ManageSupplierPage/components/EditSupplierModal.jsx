import { useEffect, useState } from "react";
import { updateSupplier } from "../../../api/suppliers.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  website: "",
};

/*
 * Modal for editing a supplier — pre-fills the form with the selected supplier's data
 */
function EditSupplierModal({ open, supplier, onClose, onUpdated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !supplier) return;
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      website: supplier.website || "",
    });
    setError(null);
  }, [open, supplier]);

  if (!open || !supplier) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await updateSupplier(supplier.id, form);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update supplier.");
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Supplier</h2>
          <button
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="edit-supplier-name" className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-supplier-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Bidvest"
            />
          </div>

          <div>
            <label htmlFor="edit-supplier-email" className={labelClass}>Email</label>
            <Input
              id="edit-supplier-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
              placeholder="e.g. orders@supplier.com"
            />
          </div>

          <div>
            <label htmlFor="edit-supplier-phone" className={labelClass}>Phone</label>
            <Input
              id="edit-supplier-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              placeholder="e.g. +64 21 123 4567"
            />
          </div>

          <div>
            <label htmlFor="edit-supplier-website" className={labelClass}>Website</label>
            <Input
              id="edit-supplier-website"
              name="website"
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              className={inputClass}
              placeholder="e.g. https://supplier.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSupplierModal;
