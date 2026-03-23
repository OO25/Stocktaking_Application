import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches a paginated list of products from the backend.
 * @param {{ page?: number, limit?: number, search?: string, category?: string }} params
 * @returns {Promise<{ rows: Array, totalCount: number }>}
 */
export async function fetchProducts({ page = 1, limit = 10, search = "", category = "" } = {}) {
  const qs = new URLSearchParams({ page, limit, search, category });
  const res = await fetchWithAuth(`${API_BASE}/products?${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

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
 * Fetches all suppliers.
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function fetchSuppliers() {
  const res = await fetchWithAuth(`${API_BASE}/suppliers`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetches all outlets (branches).
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function fetchOutlets() {
  const res = await fetchWithAuth(`${API_BASE}/outlets`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Creates a new product.
 * @param {Object} product - The product data to create.
 * @returns {Promise<Object>} The newly created product row.
 */
export async function createProduct(product) {
  const res = await fetchWithAuth(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Updates an existing product.
 * @param {number} id
 * @param {Object} product - The updated product data.
 * @returns {Promise<Object>} The updated product row.
 */
export async function updateProduct(id, product) {
  const res = await fetchWithAuth(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Deletes a product.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  const res = await fetchWithAuth(`${API_BASE}/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
}
