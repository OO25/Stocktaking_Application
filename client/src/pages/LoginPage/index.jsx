// Login form — shown when no user is authenticated

import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils.js";

function LoginPage() {
  const { login } = useAuth();

  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState({});

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate empty fields before hitting the server
    const errors = {};
    if (!username.trim()) errors.username = true;
    if (!password.trim()) errors.password = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please enter your username and password.");
      return;
    }

    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await login(username, password);
      // On success, AuthContext updates user state and App.jsx shows the main app
    } catch (err) {
      setError(err.message);
      setFieldErrors({ username: true, password: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sign-in">
      {/* Login card */}
      <div className="card border bg-card text-card-foreground shadow-sm rounded-xl -translate-y-8">
        {/* Title and subtitle */}
        <div className="header">
          <h1 className="title text-center">Stocktake Login</h1>
          <p className="description text-center mt-2">Please enter your credentials.</p>
        </div>

        <div className="content">
          <form onSubmit={handleSubmit} className="form" noValidate>

            {/* Error message — shows for empty fields or failed login */}
            {error && (
              <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Username field */}
            <div className="mt-1 field">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: false }));
                }}
                className={cn(fieldErrors.username && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>

            {/* Password field with show/hide toggle :) */}
            <div className="field">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: false }));
                  }}
                  className={cn("pr-10", fieldErrors.password && "border-red-500 focus-visible:ring-red-500")}
                />
                {/* Eye icon to toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button type="submit" disabled={loading} className="submit">
              {loading ? "Logging in…" : "Log in"}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
}
// Zane was here :)
export default LoginPage;
