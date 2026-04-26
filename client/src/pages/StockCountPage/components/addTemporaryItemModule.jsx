import { useEffect, useState } from "react";
import { fetchCategories } from "../../../api/categories.js";
import { fetchUoms } from "../../../api/uom.js";
import {
  createSessionTemporaryItem,
  updateSessionTemporaryItem,
} from "../../../api/stocktake.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import { Checkbox } from "../../../components/ui/checkbox.jsx";
import { cn } from "../../../lib/utils.js";

const INITIAL_FORM = {
  product_name: "",
  barcode: "",
  food_group_id: "",
  description: "",
  price: "",
  quantity: "0",
  package_size: "",
  unit_size: "",
  is_one_off: true,
};

function parseLegacyDescription(value) {
  const [productName = "", packageSize = "", unitSize = ""] = String(
    value || "",
  ).split(" | ");
  return {
    product_name: productName,
    package_size: packageSize,
    unit_size_name: unitSize,
  };
}

function isDirty(form) {
  return (
    form.product_name !== "" ||
    form.barcode !== "" ||
    form.food_group_id !== "" ||
    form.description !== "" ||
    form.price !== "" ||
    form.quantity !== "0" ||
    form.package_size !== "" ||
    form.unit_size !== "" ||
    form.is_one_off !== true
  );
}

function AddTemporaryItemModule({
  open,
  onClose,
  sessionId,
  onCreated,
  temporaryItem = null,
  initialValues = null,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [foodGroups, setFoodGroups] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (temporaryItem) {
      const legacy = parseLegacyDescription(temporaryItem.description);
      setForm({
        product_name:
          temporaryItem.name || temporaryItem.product_name || legacy.product_name || "",
        barcode: temporaryItem.barcode || "",
        food_group_id:
          temporaryItem.food_group_id == null
            ? ""
            : String(temporaryItem.food_group_id),
        description: temporaryItem.description || "",
        price: String(temporaryItem.price ?? ""),
        quantity: String(temporaryItem.quantity ?? 0),
        package_size:
          temporaryItem.package_size == null
            ? legacy.package_size || ""
            : Number(temporaryItem.package_size).toFixed(2),
        unit_size:
          temporaryItem.uom_id == null ? "" : String(temporaryItem.uom_id),
        is_one_off: Boolean(temporaryItem.is_one_off),
      });
    } else {
      setForm({
        ...INITIAL_FORM,
        barcode: String(initialValues?.barcode || ""),
      });
    }

    setError(null);
    setFieldErrors({});
    setDiscardOpen(false);

    fetchCategories()
      .then((data) => setFoodGroups(data.foodGroups || []))
      .catch(() => setFoodGroups([]));
    fetchUoms()
      .then((data) => setUoms(data || []))
      .catch(() => setUoms([]));
  }, [open, temporaryItem, initialValues]);

  useEffect(() => {
    if (!open || !temporaryItem || form.unit_size || uoms.length === 0) return;
    const legacy = parseLegacyDescription(temporaryItem.description);
    const sourceName = temporaryItem.uom_name || legacy.unit_size_name || "";
    if (!sourceName) return;
    const matched = uoms.find(
      (uom) => String(uom.name).toLowerCase() === String(sourceName).toLowerCase(),
    );
    if (matched) {
      setForm((prev) => ({ ...prev, unit_size: String(matched.id) }));
    }
  }, [open, temporaryItem, uoms, form.unit_size]);

  if (!open) return null;

  const resolvedFoodGroupId =
    form.food_group_id ||
    (temporaryItem?.food_group_id == null
      ? ""
      : String(temporaryItem.food_group_id));
  const selectedFoodGroupMissing =
    resolvedFoodGroupId &&
    !foodGroups.some((group) => String(group.id) === String(resolvedFoodGroupId));

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  }

  function validate() {
    const errors = {};
    if (!form.product_name.trim()) errors.product_name = true;
    if (form.price === "" || Number.isNaN(Number(form.price))) errors.price = true;
    if (!form.package_size.trim() || Number.isNaN(Number(form.package_size))) {
      errors.package_size = true;
    }
    if (!form.unit_size.trim()) errors.unit_size = true;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const labels = {
        product_name: "Product Name",
        price: "Price",
        package_size: "Package Size",
        unit_size: "Unit Size",
      };
      const missing = Object.keys(errors).map((key) => labels[key]).join(", ");
      setError(`Please fill in the following required fields: ${missing}.`);
      return false;
    }

    if (
      Number(form.price) < 0 ||
      Number(form.quantity || 0) < 0 ||
      Number(form.package_size) < 0
    ) {
      setError("Package Size, Price, and Quantity must be non-negative.");
      return false;
    }

    setError(null);
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.product_name.trim(),
        barcode: form.barcode.trim(),
        food_group_id: form.food_group_id ? Number(form.food_group_id) : null,
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity || 0),
        package_size: Number(form.package_size).toFixed(2),
        uom_id: Number(form.unit_size),
        is_one_off: form.is_one_off,
      };

      if (temporaryItem?.id) {
        await updateSessionTemporaryItem(sessionId, temporaryItem.id, payload);
      } else {
        await createSessionTemporaryItem(sessionId, payload);
      }
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save temporary item.");
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
          if (isDirty(form)) {
            setDiscardOpen(true);
          } else {
            onClose();
          }
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              {temporaryItem?.id ? "Edit Temporary Item" : "Add Temporary Item"}
            </h2>
            <button
              type="button"
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

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="temp-item-name" className={labelClass}>
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="temp-item-name"
                name="product_name"
                type="text"
                value={form.product_name}
                onChange={(event) => set("product_name", event.target.value)}
                className={cn(
                  inputClass,
                  fieldErrors.product_name && "border-red-500 focus-visible:ring-red-500",
                )}
                placeholder="e.g. Seasonal Special"
              />
            </div>

            <div>
              <label htmlFor="temp-item-description" className={labelClass}>
                Description
              </label>
              <Input
                id="temp-item-description"
                name="description"
                type="text"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                className={inputClass}
                placeholder="e.g. Limited seasonal product"
              />
            </div>

            <div>
              <label htmlFor="temp-item-barcode" className={labelClass}>
                Barcode
              </label>
              <Input
                id="temp-item-barcode"
                name="barcode"
                type="text"
                value={form.barcode}
                onChange={(event) => set("barcode", event.target.value)}
                className={inputClass}
                placeholder="e.g. 9400000001234"
              />
            </div>

            <div>
              <label htmlFor="temp-item-food-group" className={labelClass}>
                Food Group
              </label>
              <Select
                value={resolvedFoodGroupId || "__none__"}
                onValueChange={(value) =>
                  set("food_group_id", value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger id="temp-item-food-group" className="w-full">
                  <SelectValue placeholder="Select food group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {selectedFoodGroupMissing ? (
                    <SelectItem value={String(resolvedFoodGroupId)}>
                      {temporaryItem?.food_group_name ||
                        `Food Group #${resolvedFoodGroupId}`}
                    </SelectItem>
                  ) : null}
                  {foodGroups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="temp-item-price" className={labelClass}>
                  Price <span className="text-red-500">*</span>
                </label>
                <Input
                  id="temp-item-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => set("price", event.target.value)}
                  className={cn(
                    inputClass,
                    fieldErrors.price && "border-red-500 focus-visible:ring-red-500",
                  )}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="temp-item-quantity" className={labelClass}>
                  Quantity
                </label>
                <Input
                  id="temp-item-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantity}
                  onChange={(event) => set("quantity", event.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="temp-item-package-size" className={labelClass}>
                  Package Size <span className="text-red-500">*</span>
                </label>
                <Input
                  id="temp-item-package-size"
                  name="package_size"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.package_size}
                  onChange={(event) => set("package_size", event.target.value)}
                  className={cn(
                    inputClass,
                    fieldErrors.package_size &&
                      "border-red-500 focus-visible:ring-red-500",
                  )}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="temp-item-unit-size" className={labelClass}>
                  Unit Size <span className="text-red-500">*</span>
                </label>
                <Select
                  value={form.unit_size || "__none__"}
                  onValueChange={(value) =>
                    set("unit_size", value === "__none__" ? "" : value)
                  }
                >
                  <SelectTrigger
                    id="temp-item-unit-size"
                    className={cn(
                      inputClass,
                      fieldErrors.unit_size &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  >
                    <SelectValue placeholder="Select unit size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select unit size</SelectItem>
                    {uoms.map((uom) => (
                      <SelectItem key={uom.id} value={String(uom.id)}>
                        {uom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <label htmlFor="temp-item-one-off" className="text-sm text-gray-700">
                One-off item
              </label>
              <Checkbox
                id="temp-item-one-off"
                checked={form.is_one_off}
                onCheckedChange={(checked) =>
                  set("is_one_off", checked === true)
                }
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? temporaryItem?.id
                    ? "Saving..."
                    : "Adding..."
                  : temporaryItem?.id
                    ? "Save Changes"
                    : "Add Item"}
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

export default AddTemporaryItemModule;
