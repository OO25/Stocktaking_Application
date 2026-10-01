import ModalBackdrop from "../../../components/ModalBackdrop.jsx";
import { useEffect, useState } from "react";
import { createFoodGroup, createPackagingType } from "../../../api/categories.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { cn } from "../../../lib/utils.js";

const INITIAL_FORM = {
  type: "food_group",
  name: "",
  code: "",
};

/** Returns true if the form has been changed from its initial state. */
function isAddCategoryDirty(form) {
  return form.name !== "" || form.code !== "";
}

/**
 * Modal overlay for creating a new category.
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
function AddCategoryModal({ open, onClose, onCreated, existingCategories = [] }) {
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
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const labels = { name: "Name" };
      const missing = Object.keys(errors).map((k) => labels[k] || k).join(", ");
      setError(`Please fill in the following required fields: ${missing}.`);
      return false;
    }
    const duplicateName = existingCategories.some((item) =>
      item.type === (form.type === "food_group" ? "Food group" : "Packaging type") &&
      item.name.trim().toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicateName) {
      setFieldErrors({ name: true });
      setError("A category with this name already exists.");
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
      if (form.type === "food_group") {
        await createFoodGroup({
          name: form.name,
          code: form.code || null,
        });
      } else {
        await createPackagingType({
          name: form.name,
        });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";

  return (
    <>
      <ModalBackdrop
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => {
          if (isAddCategoryDirty(form)) {
            setDiscardOpen(true);
          } else {
            onClose();
          }
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Add New Category</h2>
            <button
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
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
              <label htmlFor="add-category-type" className={labelClass}>
                Category Type <span className="text-red-500">*</span>
              </label>
              <Select value={form.type} onValueChange={(value) => set("type", value)}>
                <SelectTrigger id="add-category-type" className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food_group">Food Group</SelectItem>
                  <SelectItem value="packaging_type">Packaging Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="add-category-name" className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="add-category-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn(
                  inputClass,
                  fieldErrors.name && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder={
                  form.type === "food_group" ? "e.g. Dairy" : "e.g. Plastic Bag"
                }
              />
            </div>

            {form.type === "food_group" && (
              <div>
                <label htmlFor="add-category-code" className={labelClass}>
                  Code
                </label>
                <Input
                  id="add-category-code"
                  name="code"
                  type="text"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. DAIRY-001"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add Category"}
              </Button>
            </div>
          </form>
        </div>
      </ModalBackdrop>

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

export default AddCategoryModal;
