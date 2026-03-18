const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

//export async function fetchBranches() {
//  const res = await fetch(`${BASE_URL}/api/branches`);
//  if (!res.ok) throw new Error("Failed to fetch branches");
//  return res.json();
//}

export async function fetchBranches({ page = 1, limit = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page, limit, search });
  const res = await fetch(`${BASE_URL}/api/branches?${params}`);
  if (!res.ok) throw new Error("Failed to fetch branches");
  return res.json();
}

//Create a 'Create Branch' function below

export async function createBranch({ name, branch_number }) {
  const res = await fetch(`${BASE_URL}/api/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, branch_number }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create branch");
  }

  return res.json();
}