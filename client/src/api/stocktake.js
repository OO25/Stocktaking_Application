import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

// ============================================================================
// HELPERS >^.^<
// ============================================================================

/**
 * Centralized error handling for API responses
 */
async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = body.message || body.error || `Request failed (${res.status})`;
    throw new Error(errorMsg);
  }
  return res.json().catch(() => null);
}

/**
 * Makes request with default headers and error handling
 */
async function request(url, options = {}) {
  const defaultHeaders = { "Content-Type": "application/json" };
  const res = await fetchWithAuth(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });
  return handleResponse(res);
}

// ============================================================================
// SESSIONS >^.^<
// ============================================================================

/**
 * Fetches all stocktake sessions, optionally filtered by outlet
 */
export async function fetchSessions({ outlet_id } = {}) {
  const qs = new URLSearchParams();
  if (outlet_id) qs.set("outlet_id", outlet_id);
  return request(`${API_BASE}/stocktake/sessions?${qs}`);
}

/**
 * Creates a new stocktake session
 */
export async function createSession(data) {
  return request(`${API_BASE}/stocktake/sessions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Fetches detailed session info with products and current entries
 */
export async function fetchSessionDetail(id) {
  return request(`${API_BASE}/stocktake/sessions/${id}/detail`);
}

/**
 * Deletes a stocktake session by id
 */
export async function deleteSession(id) {
  return request(`${API_BASE}/stocktake/sessions/${id}`, {
    method: "DELETE",
  });
}

/**
 * Updates a stocktake session status
 */
export async function updateSessionStatus(id, status) {
  return request(`${API_BASE}/stocktake/sessions/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ============================================================================
// ENTRIES >^.^<
// ============================================================================

/**
 * Saves product count entries for a session
 */
export async function saveSessionEntries(id, entries, finalize = false) {
  return request(`${API_BASE}/stocktake/sessions/${id}/entries`, {
    method: "PUT",
    body: JSON.stringify({ entries, finalize }),
  });
}

/**
 * Creates a temporary ad-hoc item for a stocktake session
 */
export async function createSessionTemporaryItem(id, data) {
  return request(`${API_BASE}/stocktake/sessions/${id}/new-items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Updates a temporary ad-hoc item for a stocktake session
 */
export async function updateSessionTemporaryItem(id, itemId, data) {
  return request(`${API_BASE}/stocktake/sessions/${id}/new-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Deletes a temporary ad-hoc item for a stocktake session
 */
export async function deleteSessionTemporaryItem(id, itemId) {
  return request(`${API_BASE}/stocktake/sessions/${id}/new-items/${itemId}`, {
    method: "DELETE",
  });
}

/**
 * Submits a stocktake session for final approval
 */
export async function submitSession(id) {
  return request(`${API_BASE}/stocktake/sessions/${id}/submit`, {
    method: "POST",
  });
}
