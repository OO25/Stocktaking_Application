import { fetchWithAuth } from "../lib/fetchWithAuth.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function fetchOutlets({ page = 1, limit = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page, limit, search });
  const res = await fetchWithAuth(`${BASE_URL}/api/outlets?${params}`);
  if (!res.ok) throw new Error("Failed to fetch outlets");
  return res.json();
}

export async function createOutlet({ name, cost_centre }) {
  const res = await fetchWithAuth(`${BASE_URL}/api/outlets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cost_centre }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create outlet");
  }

  return res.json();
}
