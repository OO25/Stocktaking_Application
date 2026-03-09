import { useState, useEffect } from "react";
import { fetchCategories, fetchSuppliers, createProduct } from "../api/products.js";

const INITIAL_FORM = {
  name: "",
  is_packaging: false,
  food_group_id: "",
  packaging_type_id: "",
  supplier_id: "",
  price: "",
  uom: "",
  product_code: "",
  unit_size: "",
  package_size: "",
};

/**
 * Full-screen modal overlay for creating a new product.
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
function AddProductModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState({ foodGroups: [], packagingTypes: [] });
  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (!open) return;
    fetchCategories().then(setCategories).catch(console.error);
    fetchSuppliers().then(setSuppliers).catch(console.error);
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
      await createProduct({
        ...form,
        food_group_id: form.food_group_id ? Number(form.food_group_id) : null,
        packaging_type_id: form.packaging_type_id ? Number(form.packaging_type_id) : null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        price: form.price ? Number(form.price) : 0,
        package_size: form.package_size ? Number(form.package_size) : null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = form.is_packaging
    ? categories.packagingTypes
    : categories.foodGroups;

  const categoryField = form.is_packaging ? "packaging_type_id" : "food_group_id";

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Item</h2>
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
          {/* Product type toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="product_type"
                checked={!form.is_packaging}
                onChange={() => set("is_packaging", false)}
                className="accent-blue-600"
              />
              Food
            </label>
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="product_type"
                checked={form.is_packaging}
                onChange={() => set("is_packaging", true)}
                className="accent-blue-600"
              />
              Packaging
            </label>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Chicken Breast Skinless"
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>
              {form.is_packaging ? "Packaging Type" : "Food Group"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form[categoryField]}
              onChange={(e) => set(categoryField, e.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className={labelClass}>Supplier</label>
            <select
              value={form.supplier_id}
              onChange={(e) => set("supplier_id", e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price + UOM row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>UOM</label>
              <select
                value={form.uom}
                onChange={(e) => set("uom", e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="pcs">pcs</option>
                <option value="doz">doz</option>
              </select>
            </div>
          </div>

          {/* Product code + Unit size row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Code</label>
              <input
                type="text"
                value={form.product_code}
                onChange={(e) => set("product_code", e.target.value)}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className={labelClass}>Unit Size</label>
              <input
                type="text"
                value={form.unit_size}
                onChange={(e) => set("unit_size", e.target.value)}
                className={inputClass}
                placeholder="e.g. 500g"
              />
            </div>
          </div>

          {/* Package size */}
          <div>
            <label className={labelClass}>Package Size</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.package_size}
              onChange={(e) => set("package_size", e.target.value)}
              className={inputClass}
              placeholder="e.g. 10"
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
              {submitting ? "Adding…" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
