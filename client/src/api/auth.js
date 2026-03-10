// Fetch wrappers for the auth API endpoints
// Uses /api as the base path — the Vite dev proxy forwards this to the Express server.
// In production, the Express server serves the client and handles /api from the same origin.

// POST /api/auth/login — returns { token, user } or throws on failure
export async function loginRequest(username, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed.");
  }

  return data;
}
