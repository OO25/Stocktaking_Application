// Provides auth state (user, token, login, logout) to the whole app.
// Wrap the app with <AuthProvider> in main.jsx, then use the useAuth() hook anywhere.

import { createContext, useContext, useState } from "react";
import { loginRequest } from "../api/auth.js";

const AuthContext = createContext(null);

// localStorage key for persisting the JWT across page refreshes
const STORAGE_KEY = "stocktake_auth_token";

/*
 * Reads the saved JWT from localStorage so the first render already
 * knows who's logged in, avoids a flash redirect to /login on refresh
 */
function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { user: null, token: null };
  try {
    const payload = JSON.parse(atob(raw.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, token: null };
    }
    return {
      user: { id: payload.id, username: payload.username, role: payload.role },
      token: raw,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => getStoredAuth().user);
  const [token, setToken] = useState(() => getStoredAuth().token);

  // Call the login API, save the token, and update state
  async function login(username, password) {
    const { token: newToken, user: newUser } = await loginRequest(username, password);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  // Clear all auth state and remove the token from storage
  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to read auth state from any component
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
