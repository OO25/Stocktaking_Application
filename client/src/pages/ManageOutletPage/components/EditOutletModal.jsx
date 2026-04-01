import { useEffect, useState } from "react";
import { updateOutlet } from "../../../api/outlets.js";
import ConfirmDialog from "../../../components/ConfirmDialog.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.jsx";
import { cn } from "../../../lib/utils.js";

const INITIAL_FORM = {
  name: "",
  cost_centre: "",
};

function isFormDirty(form, outlet) {
  if (!outlet) return false;

  return (
    form.name !== (outlet.name || "") ||
    form.cost_centre !== String(outlet.cost_centre || "")
  );
}

function EditOutletModal({ open, outlet, onClose, onUpdated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open || !outlet) return;

    setForm({
      name: outlet.name || "",
      cost_centre: String(outlet.cost_centre || ""),
    });
    setError(null);
    setFieldErrors({});
    setDiscardOpen(false);
  }, [open, outlet]);

  if (!outlet) return null;

  function requestClose() {
    if (isFormDirty(form, outlet)) {
      setDiscardOpen(true);
      return;
    }

    onClose();
  }

  function set(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: false,
      }));
    }
  }

  function validate() {
    const errors = {};

    if (!form.name.trim()) errors.name = true;
    if (!/^\d{3}$/.test(form.cost_centre)) errors.cost_centre = true;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please enter a name and a 3-digit cost centre.");
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
      await updateOutlet(outlet.id, {
        name: form.name.trim(),
        cost_centre: form.cost_centre,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update outlet.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) requestClose();
        }}
      >
        <DialogContent
          className="max-w-md p-0 overflow-hidden gap-0"
          showCloseButton
          overlayClassName="supports-backdrop-filter:backdrop-blur-none"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            requestClose();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            requestClose();
          }}
        >
          <DialogHeader className="px-6 py-4 border-b border-gray-100">
            <DialogTitle>Edit Outlet</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="edit-outlet-name" className={labelClass}>
                Outlet Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-outlet-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn(inputClass, fieldErrors.name && "border-red-500 focus-visible:ring-red-500")}
                placeholder="e.g. Auckland City"
              />
            </div>

            <div>
              <label htmlFor="edit-outlet-cost-centre" className={labelClass}>
                Cost Centre <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-outlet-cost-centre"
                name="cost_centre"
                type="text"
                maxLength={3}
                value={form.cost_centre}
                onChange={(e) => set("cost_centre", e.target.value.replace(/\D/g, ""))}
                className={cn(inputClass, fieldErrors.cost_centre && "border-red-500 focus-visible:ring-red-500")}
                placeholder="e.g. 042"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={requestClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

export default EditOutletModal;
