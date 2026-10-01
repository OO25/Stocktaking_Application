import ModalBackdrop from "../../../components/ModalBackdrop.jsx";
import { useEffect, useState } from "react";
import { updateUser } from "../../../api/users.js";
import { fetchOutlets } from "../../../api/products.js";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { Input } from "../../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
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
import { Check, ChevronsUpDown, Eye, EyeOff, X } from "lucide-react";

const INITIAL_FORM = {
  name: "",
  username: "",
  password: "",
  role: "manager",
};

/** Returns true if the form differs from the original user values. */
function isFormDirty(form, selectedOutlets, original) {
  if (!original) return false;
  const normalizedRole = String(original.role || "manager").toLowerCase().trim();

  if (form.name !== (original.name || "")) return true;
  if (form.username !== (original.username || "")) return true;
  if (form.password !== "") return true;
  if (form.role !== normalizedRole) return true;

  // Skip outlet comparison entirely for admin users
  if (normalizedRole === "admin") return false;

  let originalOutletIds = [];
  const savedOutletIds = original.outlet_ids ?? original.branch_ids;
  if (Array.isArray(savedOutletIds)) {
    originalOutletIds = savedOutletIds.map(String).filter(Boolean);
  } else if (typeof savedOutletIds === "string") {
    const trimmed = savedOutletIds.replace(/[{}]/g, "");
    originalOutletIds = trimmed ? trimmed.split(",").map((id) => id.trim()).filter(Boolean) : [];
  }

  return JSON.stringify(selectedOutlets.slice().sort()) !== JSON.stringify(originalOutletIds.slice().sort());
}

/**
 * Full-screen modal overlay for editing a user.
 * @param {{ open: boolean, user: any, onClose: () => void, onUpdated: () => void }} props
 */
function EditUserModal({ open, user, onClose, onUpdated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [outlets, setOutlets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [outletOpen, setOutletOpen] = useState(false);
  const [selectedOutlets, setSelectedOutlets] = useState([]);
  const [expandedOutlets, setExpandedOutlets] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const normalizedRole = String(user.role || "manager").toLowerCase().trim();
    setForm({
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: normalizedRole === "admin" ? "admin" : "manager",
    });
    setError(null);
    setFieldErrors({});
    setShowPassword(false);
    setOutletOpen(false);
    setExpandedOutlets(false);
    setDiscardOpen(false);

    let outletIds = [];
    const savedOutletIds = user.outlet_ids ?? user.branch_ids;
    if (Array.isArray(savedOutletIds)) {
      outletIds = savedOutletIds.map(String);
    } else if (typeof savedOutletIds === "string") {
      const trimmed = savedOutletIds.replace(/[{}]/g, "");
      outletIds = trimmed ? trimmed.split(",").map((id) => id.trim()).filter(Boolean) : [];
    }
    setSelectedOutlets(outletIds);
    fetchOutlets().then(setOutlets).catch(() => setOutlets([]));
  }, [open, user]);

  const roleValue = form.role || (user?.role ? String(user.role).toLowerCase().trim() : "") || "manager";

  if (!open || !user) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
    // Clear outlets immediately when switching to admin
    if (field === "role" && value === "admin") {
      setSelectedOutlets([]);
      setOutletOpen(false);
      setExpandedOutlets(false);
    }
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.username.trim()) errors.username = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const labels = { name: "Name", username: "Username" };
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
      const payload = {
        name: form.name,
        username: form.username,
        role: form.role,
        outlet_ids: selectedOutlets.map((id) => Number(id)),
      };
      if (form.password) payload.password = form.password;
      await updateUser(user.id, payload);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";
  const visibleOutlets = expandedOutlets ? selectedOutlets : selectedOutlets.slice(0, 2);
  const hiddenOutletCount = selectedOutlets.length > visibleOutlets.length
    ? selectedOutlets.length - visibleOutlets.length : 0;
  let persistedOutletIds = [];
  const savedOutletIds = user.outlet_ids ?? user.branch_ids;
  if (Array.isArray(savedOutletIds)) {
    persistedOutletIds = savedOutletIds.map(String).filter(Boolean);
  } else if (typeof savedOutletIds === "string") {
    const trimmed = savedOutletIds.replace(/[{}]/g, "");
    persistedOutletIds = trimmed ? trimmed.split(",").map((id) => id.trim()).filter(Boolean) : [];
  }
  const persistedOutletNames = persistedOutletIds
    .map((id) => outlets.find((item) => String(item.id) === String(id))?.name)
    .filter(Boolean);

  function toggleOutlet(id) {
    setSelectedOutlets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function removeOutlet(id) {
    setSelectedOutlets((prev) => prev.filter((item) => item !== id));
  }

  return (
    <>
      <ModalBackdrop
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={() => { if (isFormDirty(form, selectedOutlets, user)) { setDiscardOpen(true); } else { onClose(); } }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <button
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
              <label htmlFor="edit-user-name" className={labelClass}>
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-user-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={cn(inputClass, fieldErrors.name && "border-red-500 focus-visible:ring-red-500")}
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="edit-user-username" className={labelClass}>
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-user-username"
                name="username"
                type="text"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                className={cn(inputClass, fieldErrors.username && "border-red-500 focus-visible:ring-red-500")}
                placeholder="e.g. jdoe"
              />
            </div>

            <div>
              <label htmlFor="edit-user-password" className={labelClass}>Password</label>
              <div className="relative">
                <Input
                  id="edit-user-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={inputClass}
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="edit-user-role" className={labelClass}>
                Role <span className="text-red-500">*</span>
              </label>
              <Select name="role" value={roleValue} onValueChange={(value) => set("role", value)}>
                <SelectTrigger id="edit-user-role" className={inputClass}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="manager">manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {roleValue !== "admin" && (
              <div>
                <label className={labelClass}>Outlet Access</label>
                
                <Popover open={outletOpen} onOpenChange={setOutletOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={outletOpen}
                      className="h-auto min-h-8 w-full justify-between hover:bg-transparent"
                    >
                      <div className="flex flex-wrap items-center gap-1 pr-2.5">
                        {selectedOutlets.length > 0 ? (
                          <>
                            {visibleOutlets.map((id) => {
                              const outlet = outlets.find((item) => String(item.id) === String(id));
                              return outlet ? (
                                <Badge key={id} variant="outline" className="rounded-sm">
                                  {outlet.name}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-4"
                                    onClick={(e) => { e.stopPropagation(); removeOutlet(id); }}
                                    asChild
                                  >
                                    <span><X className="size-3" /></span>
                                  </Button>
                                </Badge>
                              ) : null;
                            })}
                            {hiddenOutletCount > 0 || expandedOutlets ? (
                              <Badge
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); setExpandedOutlets((prev) => !prev); }}
                                className="rounded-sm cursor-pointer"
                              >
                                {expandedOutlets ? "Show Less" : `+${hiddenOutletCount} more`}
                              </Badge>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Select outlets</span>
                        )}
                      </div>
                      <ChevronsUpDown className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                    <Command>
                      <CommandInput placeholder="Search outlet..." />
                      <CommandList>
                        <CommandEmpty>No outlet found.</CommandEmpty>
                        <CommandGroup>
                          {outlets.map((outlet) => (
                            <CommandItem
                              key={outlet.id}
                              value={String(outlet.id)} keywords={[outlet.name]}
                              onSelect={() => toggleOutlet(String(outlet.id))}
                              className="flex w-full items-center justify-between"
                            >
                              <span className="truncate">{outlet.name}</span>
                              {selectedOutlets.includes(String(outlet.id)) && <Check size={16} />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
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

export default EditUserModal;
