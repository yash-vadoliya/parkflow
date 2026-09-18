import CONFIG from './Config';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export const asRows = (payload) => (
  Array.isArray(payload) ? payload : payload?.data || payload?.users || []
);
