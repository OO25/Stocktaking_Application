import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches all users.
 * @returns {Promise<Array<{ id: number, name: string, username: string, password_hash: string | null, role: string | null, created_at: string | null, updated_at: string | null }>>}
 */
export async function fetchUsers() {
  const res = await fetchWithAuth(`${API_BASE}/users`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Creates a new user.
 * @param {{ name: string, username: string, password: string, role: "admin" | "manager" }} user
 * @returns {Promise<Object>} The newly created user.
 */
export async function createUser(user) {
  const res = await fetchWithAuth(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Updates an existing user.
 * @param {number} id
 * @param {{ name: string, username: string, password?: string, role: "admin" | "manager" }} user
 * @returns {Promise<Object>} The updated user.
 */
export async function updateUser(id, user) {
  const res = await fetchWithAuth(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Deletes a user.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  const res = await fetchWithAuth(`${API_BASE}/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
}
