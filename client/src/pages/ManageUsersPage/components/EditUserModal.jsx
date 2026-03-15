import { useEffect, useState } from "react";
import { updateUser } from "../../../api/users.js";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import { Eye, EyeOff } from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: user.role || "manager",
    });
    setError(null);
    setShowPassword(false);
  }, [open, user]);

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
            <label className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className={labelClass}>
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              className={inputClass}
              placeholder="e.g. jdoe"
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Input
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
            <label className={labelClass}>
              Role <span className="text-red-500">*</span>
            </label>
            <Select value={form.role} onValueChange={(value) => set("role", value)}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="manager">manager</SelectItem>
              </SelectContent>
            </Select>
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

export default EditUserModal;
