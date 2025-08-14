const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface ApiError {
  status: number;
  message: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = (data && (data.error || data.message)) || msg;
    } catch {
      // ignore json parse error
    }
    const err: ApiError = { status: res.status, message: msg };
    throw err;
  }
  return (await res.json()) as T;
}

export const api = {
  get: async <T>(path: string) => handle<T>(await fetch(`${API_BASE}${path}`, { credentials: 'include' })),
  post: async <T>(path: string, body?: unknown) =>
    handle<T>(
      await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
    ),
  del: async <T>(path: string) => handle<T>(await fetch(`${API_BASE}${path}`, { method: 'DELETE', credentials: 'include' })),
};
