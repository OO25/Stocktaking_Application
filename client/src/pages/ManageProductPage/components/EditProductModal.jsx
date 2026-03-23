import { useState, useEffect } from "react";
import { fetchCategories, fetchSuppliers, fetchOutlets, updateProduct } from "../../../api/products.js";
import { fetchUoms } from "../../../api/uom.js";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../components/ui/command.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover.jsx";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { cn } from "../../../lib/utils.js";
import { Check, ChevronsUpDown, X } from "lucide-react";

const INITIAL_FORM = {
  name: "",
  is_packaging: false,
  food_group_id: "",
  packaging_type_id: "",
  supplier_id: "",
  price: "",
  uom_id: "",
  product_code: "",
  unit_size: "",
  package_size: "",
};

/** Returns true if the form differs from the original product values. */
function isFormDirty(form, selectedOutlets, original) {
  if (!original) return false;
  return (
    form.name !== (original.name || "") ||
    form.is_packaging !== Boolean(original.is_packaging) ||
    form.food_group_id !== (original.food_group_id ? String(original.food_group_id) : "") ||
    form.packaging_type_id !== (original.packaging_type_id ? String(original.packaging_type_id) : "") ||
    form.supplier_id !== (original.supplier_id ? String(original.supplier_id) : "") ||
    form.price !== (original.price != null ? String(original.price) : "") ||
    form.uom_id !== (original.uom_id ? String(original.uom_id) : "") ||
    form.product_code !== (original.product_code || "") ||
    form.unit_size !== (original.unit_size || "") ||
    form.package_size !== (original.package_size != null ? String(original.package_size) : "") ||
    JSON.stringify(selectedOutlets.slice().sort()) !== JSON.stringify(
      (Array.isArray(original.outlet_ids) ? original.outlet_ids.map(String) : []).slice().sort()
    )
  );
}

/**
 * Full-screen modal overlay for editing an existing product.
 * @param {{ open: boolean, product: any, onClose: () => void, onUpdated: () => void }} props
 */
function EditProductModal({ open, product, onClose, onUpdated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState({ foodGroups: [], packagingTypes: [] });
  const [suppliers, setSuppliers] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [uomOpen, setUomOpen] = useState(false);
  const [outletOpen, setOutletOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Load dropdown data and pre-populate form when modal opens
  useEffect(() => {
    if (!open || !product) return;
    fetchCategories().then(setCategories).catch(console.error);
    fetchSuppliers().then(setSuppliers).catch(console.error);
    fetchUoms().then(setUoms).catch(console.error);
    fetchOutlets().then(setOutlets).catch(console.error);
    setCategoryOpen(false);
    setSupplierOpen(false);
    setUomOpen(false);
    setOutletOpen(false);
    setError(null);
    setFieldErrors({});
    setDiscardOpen(false);

    // Pre-populate form with existing product values
    setForm({
      name: product.name || "",
      is_packaging: Boolean(product.is_packaging),
      food_group_id: product.food_group_id ? String(product.food_group_id) : "",
      packaging_type_id: product.packaging_type_id ? String(product.packaging_type_id) : "",
      supplier_id: product.supplier_id ? String(product.supplier_id) : "",
      price: product.price != null ? String(product.price) : "",
      uom_id: product.uom_id ? String(product.uom_id) : "",
      product_code: product.product_code || "",
      unit_size: product.unit_size || "",
      package_size: product.package_size != null ? String(product.package_size) : "",
    });

    // Pre-populate selected outlets
    const outletIds = Array.isArray(product.outlet_ids)
      ? product.outlet_ids.map(String)
      : [];
    setSelectedOutlets(outletIds);
  }, [open, product]);

  if (!open || !product) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
  }

  function toggleOutlet(id) {
    setSelectedOutlets((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }

  function removeOutlet(id) {
    setSelectedOutlets((prev) => prev.filter((o) => o !== id));
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (form.is_packaging) {
      if (!form.packaging_type_id) errors.packaging_type_id = true;
    } else {
      if (!form.food_group_id) errors.food_group_id = true;
    }
    if (!form.supplier_id) errors.supplier_id = true;
    if (form.price === "" || form.price === null) errors.price = true;
    if (!form.uom_id) errors.uom_id = true;
    if (!form.unit_size.trim()) errors.unit_size = true;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const labels = {
        name: "Name",
        food_group_id: "Food Group",
        packaging_type_id: "Packaging Type",
        supplier_id: "Supplier",
        price: "Price",
        uom_id: "UOM",
        unit_size: "Unit Size",
      };
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
      await updateProduct(product.id, {
        ...form,
        food_group_id: form.food_group_id ? Number(form.food_group_id) : null,
        packaging_type_id: form.packaging_type_id ? Number(form.packaging_type_id) : null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        uom_id: form.uom_id ? Number(form.uom_id) : null,
        price: form.price ? Number(form.price) : 0,
        package_size: form.package_size ? Number(form.package_size) : null,
        outlet_ids: selectedOutlets.map(Number),
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = form.is_packaging
    ? categories.packagingTypes
    : categories.foodGroups;

  const categoryField = form.is_packaging ? "packaging_type_id" : "food_group_id";
  const selectedCategory = categoryOptions.find(
    (cat) => String(cat.id) === String(form[categoryField])
  );
  const selectedSupplier = suppliers.find(
    (s) => String(s.id) === String(form.supplier_id)
  );
  const selectedUom = uoms.find((u) => String(u.id) === String(form.uom_id));

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";
  const invalidBtn = "border-red-500 focus:ring-red-500";

  return (
    <>
      {/* Backdrop and modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => {
          if (isFormDirty(form, selectedOutlets, product)) {
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
            <h2 className="text-lg font-bold text-gray-900">Edit Item</h2>
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

            {/* Error summary */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Product type toggle */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <RadioGroup
                value={form.is_packaging ? "packaging" : "food"}
                onValueChange={(value) => {
                  set("is_packaging", value === "packaging");
                  set("food_group_id", "");
                  set("packaging_type_id", "");
                  setFieldErrors((prev) => ({ ...prev, food_group_id: false, packaging_type_id: false }));
                }}
                className="flex items-center gap-4"
              >
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="food" />
                  Food
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="packaging" />
                  Packaging
                </label>
              </RadioGroup>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="edit-product-name" className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-product-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn(inputClass, fieldErrors.name && "border-red-500 focus-visible:ring-red-500")}
                placeholder="e.g. Chicken Breast Skinless"
              />
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>
                {form.is_packaging ? "Packaging Type" : "Food Group"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className={cn("w-full justify-between", !selectedCategory && "text-muted-foreground", fieldErrors[categoryField] && invalidBtn)}
                    onClick={() => setFieldErrors((prev) => ({ ...prev, [categoryField]: false }))}
                  >
                    {selectedCategory ? selectedCategory.name : "Select..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                  <Command>
                    <CommandInput placeholder={`Search ${form.is_packaging ? "packaging" : "food"}...`} className="h-9" />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categoryOptions.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => { set(categoryField, String(cat.id)); setCategoryOpen(false); }}
                            className="flex w-full items-center justify-between"
                          >
                            {cat.name}
                            <Check className={cn(String(form[categoryField]) === String(cat.id) ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Supplier */}
            <div>
              <label className={labelClass}>
                Supplier <span className="text-red-500">*</span>
              </label>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierOpen}
                    className={cn("w-full justify-between", !selectedSupplier && "text-muted-foreground", fieldErrors.supplier_id && invalidBtn)}
                    onClick={() => setFieldErrors((prev) => ({ ...prev, supplier_id: false }))}
                  >
                    {selectedSupplier ? selectedSupplier.name : "Select..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                  <Command>
                    <CommandInput placeholder="Search supplier..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No supplier found.</CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.name}
                            onSelect={() => { set("supplier_id", String(s.id)); setSupplierOpen(false); }}
                            className="flex w-full items-center justify-between"
                          >
                            {s.name}
                            <Check className={cn(String(form.supplier_id) === String(s.id) ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Outlets multi-select */}
            <div>
              <label className={labelClass}>Outlets</label>
              <Popover open={outletOpen} onOpenChange={setOutletOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={outletOpen}
                    className="h-auto min-h-9 w-full justify-between hover:bg-transparent"
                  >
                    <div className="flex flex-wrap items-center gap-1 pr-2.5">
                      {selectedOutlets.length > 0 ? (
                        selectedOutlets.map((id) => {
                          const outlet = outlets.find((o) => String(o.id) === String(id));
                          return outlet ? (
                            <Badge key={id} variant="outline" className="rounded-sm">
                              {outlet.name}
                              <span
                                className="ml-1 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); removeOutlet(id); }}
                              >
                                <X className="h-3 w-3" />
                              </span>
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground">Select outlets...</span>
                      )}
                    </div>
                    <ChevronsUpDown className="text-muted-foreground/80 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                  <Command>
                    <CommandInput placeholder="Search outlet..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No outlet found.</CommandEmpty>
                      <CommandGroup>
                        {outlets.map((outlet) => (
                          <CommandItem
                            key={outlet.id}
                            value={outlet.name}
                            onSelect={() => toggleOutlet(String(outlet.id))}
                            className="flex w-full items-center justify-between"
                          >
                            {outlet.name}
                            {selectedOutlets.includes(String(outlet.id)) && <Check className="h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Price + UOM row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-product-price" className={labelClass}>
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-product-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className={cn(inputClass, fieldErrors.price && "border-red-500 focus-visible:ring-red-500")}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClass}>
                  UOM <span className="text-red-500">*</span>
                </label>
                <Popover open={uomOpen} onOpenChange={setUomOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={uomOpen}
                      className={cn("w-full justify-between", !form.uom_id && "text-muted-foreground", fieldErrors.uom_id && invalidBtn)}
                      onClick={() => setFieldErrors((prev) => ({ ...prev, uom_id: false }))}
                    >
                      {selectedUom ? selectedUom.name : "Select..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search UOM..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No unit found.</CommandEmpty>
                        <CommandGroup>
                          {uoms.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={u.name}
                              onSelect={() => { set("uom_id", String(u.id)); setUomOpen(false); }}
                              className="flex w-full items-center justify-between"
                            >
                              {u.name}
                              <Check className={cn(String(form.uom_id) === String(u.id) ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Package Size + Unit Size row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-product-package-size" className={labelClass}>Package Size</label>
                <Input
                  id="edit-product-package-size"
                  name="package_size"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.package_size}
                  onChange={(e) => set("package_size", e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label htmlFor="edit-product-unit-size" className={labelClass}>
                  Unit Size <span className="text-red-500">*</span>
                </label>
                <Input
                  id="edit-product-unit-size"
                  name="unit_size"
                  type="text"
                  value={form.unit_size}
                  onChange={(e) => set("unit_size", e.target.value)}
                  className={cn(inputClass, fieldErrors.unit_size && "border-red-500 focus-visible:ring-red-500")}
                  placeholder="e.g. 500g"
                />
              </div>
            </div>

            {/* Product Barcode */}
            <div>
              <label htmlFor="edit-product-barcode" className={labelClass}>Product Barcode</label>
              <Input
                id="edit-product-barcode"
                name="product_code"
                type="text"
                value={form.product_code}
                onChange={(e) => set("product_code", e.target.value)}
                className={inputClass}
                placeholder="Optional"
              />
            </div>

            {/* Actions */}
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

      {/* Discard confirmation — outside backdrop so Keep Editing works correctly */}
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

export default EditProductModal;
