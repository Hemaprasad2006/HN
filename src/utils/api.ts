const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('hn-auth-token');
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) return null;
  return response.json();
}
