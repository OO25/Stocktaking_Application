const STORAGE_KEY = "stocktake_auth_token";

/*
 * Same as fetch() but automatically attaches the JWT auth header
 */
export function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem(STORAGE_KEY);
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
