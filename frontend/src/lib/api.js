const API_BASE = `/api`;

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    accessToken = data.accessToken;

    return accessToken;
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${cleanPath}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auto refresh on 401 — but never for auth endpoints (prevents retry loop)
  if (res.status === 401 && !cleanPath.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}