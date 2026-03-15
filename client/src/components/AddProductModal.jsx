import { useState, useEffect } from "react";
import { fetchCategories, fetchSuppliers, createProduct } from "../api/products.js";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover.jsx";
import { cn } from "../lib/utils.js";
import { Check, ChevronsUpDown } from "lucide-react";

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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [uomOpen, setUomOpen] = useState(false);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (!open) return;
    fetchCategories().then(setCategories).catch(console.error);
    fetchSuppliers().then(setSuppliers).catch(console.error);
    setForm(INITIAL_FORM);
    setCategoryOpen(false);
    setSupplierOpen(false);
    setUomOpen(false);
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
  const selectedCategory = categoryOptions.find(
    (cat) => String(cat.id) === String(form[categoryField])
  );
  const selectedSupplier = suppliers.find(
    (supplier) => String(supplier.id) === String(form.supplier_id)
  );
  const uomOptions = ["kg", "g", "L", "mL", "pcs", "doz"];

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";

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
            <RadioGroup
              value={form.is_packaging ? "packaging" : "food"}
              onValueChange={(value) =>
                set("is_packaging", value === "packaging")
              }
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
            <label className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <Input
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
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className={cn("w-full justify-between", !selectedCategory && "text-muted-foreground")}
                  aria-label="Category combobox"
                >
                  {selectedCategory ? selectedCategory.name : "Select..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput
                    placeholder={`Search ${form.is_packaging ? "packaging" : "food"}...`}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {categoryOptions.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          onSelect={() => {
                            set(categoryField, String(cat.id));
                            setCategoryOpen(false);
                          }}
                          className="flex w-full items-center justify-between"
                        >
                          {cat.name}
                          <Check
                            className={cn(
                              String(form[categoryField]) === String(cat.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
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
            <label className={labelClass}>Supplier <span className="text-red-500">*</span></label>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={supplierOpen}
                  className={cn("w-full justify-between", !selectedSupplier && "text-muted-foreground")}
                  aria-label="Supplier combobox"
                >
                  {selectedSupplier ? selectedSupplier.name : "Select..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput placeholder="Search supplier..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No supplier found.</CommandEmpty>
                    <CommandGroup>
                      {suppliers.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => {
                            set("supplier_id", String(s.id));
                            setSupplierOpen(false);
                          }}
                          className="flex w-full items-center justify-between"
                        >
                          {s.name}
                          <Check
                            className={cn(
                              String(form.supplier_id) === String(s.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
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
              <label className={labelClass}>Price ($) <span className="text-red-500">*</span></label>
              <Input
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
              <label className={labelClass}>UOM <span className="text-red-500">*</span></label>
              <Popover open={uomOpen} onOpenChange={setUomOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={uomOpen}
                    className={cn("w-full justify-between", !form.uom && "text-muted-foreground")}
                    aria-label="UOM combobox"
                  >
                    {form.uom || "Select..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search UOM..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No unit found.</CommandEmpty>
                      <CommandGroup>
                        {uomOptions.map((uom) => (
                          <CommandItem
                            key={uom}
                            value={uom}
                            onSelect={() => {
                              set("uom", uom);
                              setUomOpen(false);
                            }}
                            className="flex w-full items-center justify-between"
                          >
                            {uom}
                            <Check
                              className={cn(
                                form.uom === uom ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Product code + Unit size row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Barcode</label>
              <Input
                type="text"
                value={form.product_code}
                onChange={(e) => set("product_code", e.target.value)}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className={labelClass}>Unit Size <span className="text-red-500">*</span></label>
              <Input
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
            <Input
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
