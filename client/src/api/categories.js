import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches all categories (food groups + packaging types).
 * @returns {Promise<{ foodGroups: Array, packagingTypes: Array }>}
 */
export async function fetchCategories() {
  const res = await fetchWithAuth(`${API_BASE}/categories`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Creates a new food group category.
 * @param {{ code?: string, name: string, parent_id?: number, sort_order?: number }} data
 * @returns {Promise<{ id: number, code: string, name: string, parent_id: number, sort_order: number, created_at: string, updated_at: string }>}
 */
export async function createFoodGroup(data) {
  const res = await fetchWithAuth(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "food_group", ...data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Creates a new packaging type category.
 * @param {{ name: string, sort_order?: number }} data
 * @returns {Promise<{ id: number, name: string, sort_order: number, created_at: string, updated_at: string }>}
 */
export async function createPackagingType(data) {
  const res = await fetchWithAuth(`${API_BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "packaging_type", ...data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Updates a food group category.
 * @param {number} id
 * @param {{ code?: string, name: string, parent_id?: number, sort_order?: number }} data
 * @returns {Promise<{ id: number, code: string, name: string, parent_id: number, sort_order: number, created_at: string, updated_at: string }>}
 */
export async function updateFoodGroup(id, data) {
  const res = await fetchWithAuth(`${API_BASE}/categories/food_group/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Updates a packaging type category.
 * @param {number} id
 * @param {{ name: string, sort_order?: number }} data
 * @returns {Promise<{ id: number, name: string, sort_order: number, created_at: string, updated_at: string }>}
 */
export async function updatePackagingType(id, data) {
  const res = await fetchWithAuth(`${API_BASE}/categories/packaging_type/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Deletes a food group category.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteFoodGroup(id) {
  const res = await fetchWithAuth(`${API_BASE}/categories/food_group/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
}

/**
 * Deletes a packaging type category.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deletePackagingType(id) {
  const res = await fetchWithAuth(`${API_BASE}/categories/packaging_type/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
}
