import { supabaseBrowser } from './supabase-browser';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;
  const isFormData = init.body instanceof FormData;

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Falha na API.');
  }
  return payload as T;
}

export async function getSessionRole() {
  const { data } = await supabaseBrowser.auth.getSession();
  if (!data.session) return null;

  const res = await apiFetch<{ profile: { role: 'teacher' | 'student' | 'admin' } }>('/api/me');
  return res.profile.role;
}
