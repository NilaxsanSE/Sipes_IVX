const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === 'string') {
        message = body.detail;
      }
    } catch {
      // Keep the status-based fallback message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
