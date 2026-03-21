import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/*
 * Fetches all stocktake sessions, can filter by branch if needed
 */
export async function fetchSessions({ outlet_id } = {}) {
  const qs = new URLSearchParams();
  if (outlet_id) qs.set("outlet_id", outlet_id);      

  const res = await fetchWithAuth(`${API_BASE}/stocktake/sessions?${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/*
 * Creates a new stocktake session — assigns a stocktake to a branch
 */
export async function createSession(data) {
  const res = await fetchWithAuth(`${API_BASE}/stocktake/sessions`, {
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
 * Deletes a stocktake session by id
 */
export async function deleteSession(id) {
  const res = await fetchWithAuth(`${API_BASE}/stocktake/sessions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
}

/*
 * Fetches session detail with all products and current entries
 */
export async function fetchSessionDetail(id) {
  const res = await fetchWithAuth(`${API_BASE}/stocktake/sessions/${id}/detail`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/*
 * Saves product count entries for a session
 */
export async function saveSessionEntries(id, entries, finalize = false) {
  const res = await fetchWithAuth(`${API_BASE}/stocktake/sessions/${id}/entries`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries, finalize }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/*
 * Submits a stocktake session for final approval
 */
export async function submitSession(id) {
  const res = await fetchWithAuth(`${API_BASE}/stocktake/sessions/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}
