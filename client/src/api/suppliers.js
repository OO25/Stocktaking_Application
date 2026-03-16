import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/*
 * Grabs all suppliers from the API
 */
export async function fetchAllSuppliers() {
  const res = await fetchWithAuth(`${API_BASE}/suppliers`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/*
 * Sends a new supplier to the API and returns the created record
 */
export async function createSupplier(data) {
  const res = await fetchWithAuth(`${API_BASE}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/*
 * Updates an existing supplier by id
 */
export async function updateSupplier(id, data) {
  const res = await fetchWithAuth(`${API_BASE}/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/*
 * Deletes a supplier by id
 */
export async function deleteSupplier(id) {
  const res = await fetchWithAuth(`${API_BASE}/suppliers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
}
