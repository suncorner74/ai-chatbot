export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthResponse { user: AuthUser }

const API_URL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL;

async function request(path: string, options: RequestInit = {}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message || 'Authentication request failed.');
  }

  if (response.status === 204) return { user: null as never };
  return response.json() as Promise<AuthResponse>;
}

export function getMe() { return request('/me'); }
export function login(email: string, password: string) {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function register(email: string, password: string, name?: string) {
  return request('/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
}
export function logout() { return request('/logout', { method: 'POST' }); }
