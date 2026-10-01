import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function fetchOutlets({ page = 1, limit = 10, search = "", sort = "az" } = {}) {
  const params = new URLSearchParams({ page, limit, search, sort });
  const res = await fetchWithAuth(`${API_BASE}/outlets?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch outlets (${res.status})`);
  }
  return res.json();
}

export async function createOutlet({ name, cost_centre }) {
  const res = await fetchWithAuth(`${API_BASE}/outlets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cost_centre }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create outlet (${res.status})`);
  }

  return res.json();
}

// New function to delete outlet (Alex T.)
export async function deleteOutlet(id) {
  const res = await fetchWithAuth(`${API_BASE}/outlets/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete outlet (${res.status})`);
  }

  return res.json();
}

// New function to update outlet (Alex T.)
export async function updateOutlet(id, { name, cost_centre }) {
  const res = await fetchWithAuth(`${API_BASE}/outlets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cost_centre }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update outlet (${res.status})`);
  }

  return res.json();
}