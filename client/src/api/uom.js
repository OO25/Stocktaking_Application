const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Fetches all units of measure.
 * @returns {Promise<Array<{ id: number, name: string, description?: string | null, created_at?: string | null, updated_at?: string | null }>>}
 */
export async function fetchUoms() {
  const res = await fetch(`${API_BASE}/uom`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}
