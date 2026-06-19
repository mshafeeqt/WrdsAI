const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
let authenticatedUserCache = null;

export function setAuthenticatedUserCache(user) {
  authenticatedUserCache = user || null;
}

export function getAuthenticatedUserCache() {
  return authenticatedUserCache;
}

export async function fetchCurrentUser() {
  const response = await fetch(`${apiBaseUrl}/api/ai/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || "Failed to load user");
  }

  authenticatedUserCache = data.data || null;
  return authenticatedUserCache;
}

export async function logoutCurrentUser() {
  const response = await fetch(`${apiBaseUrl}/api/ai/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Logout failed");
  }

  authenticatedUserCache = null;
}
