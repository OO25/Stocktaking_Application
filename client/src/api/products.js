const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches a paginated list of products from the backend.
 * @param {{ page?: number, limit?: number, search?: string }} params
 * @returns {Promise<{ rows: Array, totalCount: number }>}
 */
export async function fetchProducts({ page = 1, limit = 10, search = "" } = {}) {
  const qs = new URLSearchParams({ page, limit, search });
  const res = await fetch(`${API_BASE}/products?${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}
