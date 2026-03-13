const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches a paginated list of products from the backend.
 * @param {{ page?: number, limit?: number, search?: string, category?: string }} params
 * @returns {Promise<{ rows: Array, totalCount: number }>}
 */
export async function fetchProducts({ page = 1, limit = 10, search = "", category = "" } = {}) {
  const qs = new URLSearchParams({ page, limit, search, category });
  const res = await fetch(`${API_BASE}/products?${qs}`);
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
  const res = await fetch(`${API_BASE}/categories`);
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
  const res = await fetch(`${API_BASE}/suppliers`);
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
  const res = await fetch(`${API_BASE}/outlets`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetches all users.
 * @returns {Promise<Array<{ id: number, name: string, username: string, password_hash: string | null, role: string | null, created_at: string | null, updated_at: string | null }>>}
 */
export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
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
  const res = await fetch(`${API_BASE}/products`, {
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
