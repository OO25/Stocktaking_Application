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

/**
 * Creates a new unit of measure.
 * @param {{ name: string, description?: string }} uom
 * @returns {Promise<Object>} The newly created UOM.
 */
export async function createUom(uom) {
  const res = await fetch(`${API_BASE}/uom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uom),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Updates an existing unit of measure.
 * @param {number} id
 * @param {{ name: string, description?: string }} uom
 * @returns {Promise<Object>} The updated UOM.
 */
export async function updateUom(id, uom) {
  const res = await fetch(`${API_BASE}/uom/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uom),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Deletes a unit of measure.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteUom(id) {
  const res = await fetch(`${API_BASE}/uom/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
}
