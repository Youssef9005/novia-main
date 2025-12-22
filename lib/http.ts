// Unified HTTP client for frontend API calls
// Ensures base URL usage, includes credentials for HttpOnly cookies, and consistent error handling

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.novia-ai.com';

type JsonInit = Omit<RequestInit, 'body' | 'headers'> & {
  headers?: Record<string, string>;
  body?: any;
};

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? path : `/${path}`}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function apiFetch<T = any>(path: string, options: JsonInit = {}): Promise<T> {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const init: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };

  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';

  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}