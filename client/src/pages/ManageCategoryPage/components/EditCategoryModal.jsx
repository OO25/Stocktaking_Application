import ModalBackdrop from "../../../components/ModalBackdrop.jsx";
import { useEffect, useState } from "react";
import { updateFoodGroup, updatePackagingType } from "../../../api/categories.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { cn } from "../../../lib/utils.js";

const INITIAL_FORM = {
  name: "",
  code: "",
};

/** Returns true if the form differs from the original category values. */
function isFormDirty(form, original) {
  if (!original) return false;
  return (
    form.name !== (original.name || "") ||
    form.code !== (original.code || "")
  );
}

/**
 * Modal overlay for editing an existing category.
 * @param {{ open: boolean, category: any, onClose: () => void, onUpdated: () => void }} props
 */
function EditCategoryModal({ open, category, onClose, onUpdated, existingCategories = [] }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open || !category) return;
    setForm({
      name: category.name || "",
      code: category.code || "",
    });
    setError(null);
    setFieldErrors({});
    setDiscardOpen(false);
  }, [open, category]);

  if (!open || !category) return null;

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
      setError("Please fill in the following required fields: Name.");
      return false;
    }
    const duplicateName = existingCategories.some((item) =>
      item.type === category.type && item.key !== category.key &&
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
      // Determine if it's a food group or packaging type based on the category object
      const isFoodGroup = category.code !== undefined;

      if (isFoodGroup) {
        await updateFoodGroup(category.id, {
          name: form.name,
          code: form.code || null,
        });
      } else {
        await updatePackagingType(category.id, {
          name: form.name,
        });
      }
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update category.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";
  const isFoodGroup = category.code !== undefined;

  return (
    <>
      <ModalBackdrop
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => {
          if (isFormDirty(form, category)) {
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
            <h2 className="text-lg font-bold text-gray-900">Edit Category</h2>
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
              <label htmlFor="edit-category-name" className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-category-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn(
                  inputClass,
                  fieldErrors.name && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder={isFoodGroup ? "e.g. Dairy" : "e.g. Plastic Bag"}
              />
            </div>

            {isFoodGroup && (
              <div>
                <label htmlFor="edit-category-code" className={labelClass}>
                  Code
                </label>
                <Input
                  id="edit-category-code"
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
                {submitting ? "Saving…" : "Save Changes"}
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

export default EditCategoryModal;
