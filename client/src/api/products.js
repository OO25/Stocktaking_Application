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
