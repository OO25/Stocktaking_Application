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
import { Check, ChevronsUpDown, Eye, EyeOff, X } from "lucide-react";

const INITIAL_FORM = {
  name: "",
  username: "",
  password: "",
  role: "manager",
};

/**
 * Full-screen modal overlay for editing a user.
 * @param {{ open: boolean, user: any, onClose: () => void, onUpdated: () => void }} props
 */
function EditUserModal({ open, user, onClose, onUpdated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [outlets, setOutlets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [expandedBranches, setExpandedBranches] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const normalizedRole = String(user.role || "manager")
      .toLowerCase()
      .trim();
    setForm({
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: normalizedRole === "admin" ? "admin" : "manager",
    });
    setError(null);
    setShowPassword(false);
    setBranchOpen(false);
    setExpandedBranches(false);
    let branchIds = [];
    if (Array.isArray(user.branch_ids)) {
      branchIds = user.branch_ids.map(String);
    } else if (typeof user.branch_ids === "string") {
      const trimmed = user.branch_ids.replace(/[{}]/g, "");
      branchIds = trimmed
        ? trimmed.split(",").map((id) => id.trim()).filter(Boolean)
        : [];
    }
    setSelectedBranches(branchIds);
    fetchOutlets().then(setOutlets).catch(() => setOutlets([]));
  }, [open, user]);

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full";
  const roleValue = form.role
    || (user?.role ? String(user.role).toLowerCase().trim() : "")
    || "manager";

  useEffect(() => {
    if (roleValue === "admin") {
      setSelectedBranches([]);
      setBranchOpen(false);
      setExpandedBranches(false);
    }
  }, [roleValue]);

  if (!open || !user) return null;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        username: form.username,
        role: form.role,
        branch_ids: selectedBranches.map((id) => Number(id)),
      };

      if (form.password) {
        payload.password = form.password;
      }

      await updateUser(user.id, payload);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  }
  const visibleBranches = expandedBranches
    ? selectedBranches
    : selectedBranches.slice(0, 2);
  const hiddenBranchCount =
    selectedBranches.length > visibleBranches.length
      ? selectedBranches.length - visibleBranches.length
      : 0;

  function toggleBranch(id) {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function removeBranch(id) {
    setSelectedBranches((prev) => prev.filter((item) => item !== id));
  }

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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="edit-user-name" className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-user-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
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
              required
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              className={inputClass}
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="edit-user-role" className={labelClass}>
              Role <span className="text-red-500">*</span>
            </label>
            <Select
              name="role"
              value={roleValue}
              onValueChange={(value) => set("role", value)}
            >
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
              <label className={labelClass}>Branch Access</label>
              <Popover open={branchOpen} onOpenChange={setBranchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={branchOpen}
                  className="h-auto min-h-8 w-full justify-between hover:bg-transparent"
                >
                  <div className="flex flex-wrap items-center gap-1 pr-2.5">
                    {selectedBranches.length > 0 ? (
                      <>
                        {visibleBranches.map((id) => {
                          const outlet = outlets.find(
                            (item) => String(item.id) === String(id)
                          );

                          return outlet ? (
                            <Badge key={id} variant="outline" className="rounded-sm">
                              {outlet.name}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeBranch(id);
                                }}
                                asChild
                              >
                                <span>
                                  <X className="size-3" />
                                </span>
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                        {hiddenBranchCount > 0 || expandedBranches ? (
                          <Badge
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBranches((prev) => !prev);
                            }}
                            className="rounded-sm cursor-pointer"
                          >
                            {expandedBranches ? "Show Less" : `+${hiddenBranchCount} more`}
                          </Badge>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Select branches
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown
                    className="text-muted-foreground/80 shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput placeholder="Search branch..." />
                  <CommandList>
                    <CommandEmpty>No branch found.</CommandEmpty>
                    <CommandGroup>
                      {outlets.map((outlet) => (
                        <CommandItem
                          key={outlet.id}
                          value={outlet.name}
                          onSelect={() => toggleBranch(String(outlet.id))}
                          className="flex w-full items-center justify-between"
                        >
                          <span className="truncate">{outlet.name}</span>
                          {selectedBranches.includes(String(outlet.id)) && (
                            <Check size={16} />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
              </Popover>
            </div>
          )}

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

export default EditUserModal;
