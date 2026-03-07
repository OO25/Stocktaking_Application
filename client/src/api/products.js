const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches all products from the backend.
 * @returns {Promise<Array>} Array of product objects.
 */
export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Use || not ?? so that empty strings also fall back to the default message
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}
