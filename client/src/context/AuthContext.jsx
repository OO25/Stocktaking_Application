// Provides auth state (user, token, login, logout) to the whole app.
// Wrap the app with <AuthProvider> in main.jsx, then use the useAuth() hook anywhere.

import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest } from "../api/auth.js";

const AuthContext = createContext(null);

// localStorage key for persisting the JWT across page refreshes
const STORAGE_KEY = "stocktake_auth_token";

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);

  // On first render, restore a saved session from localStorage if still valid
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
      try {
        // JWT payload is the middle base64 segment
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          setToken(storedToken);
          setUser({ id: payload.id, username: payload.username, role: payload.role });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY); // clear malformed token
      }
    }
  }, []);

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
