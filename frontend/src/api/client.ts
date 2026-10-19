type ErrorBody = Record<string, unknown> | null;

function collectMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectMessages);
  return [];
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, body: ErrorBody) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, value] of Object.entries(body ?? {})) {
      if (field !== 'detail') fieldErrors[field] = collectMessages(value);
    }
    const detail = typeof body?.detail === 'string' ? body.detail : undefined;
    const firstFieldError = Object.values(fieldErrors).flat()[0];
    super(detail ?? firstFieldError ?? `Erro inesperado (${status}).`);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, { detail: 'Não foi possível contactar o servidor.' });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(0, { detail: 'Não foi possível contactar o servidor.' });
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}

export const http = {
  get: <T>(path: string, headers?: HeadersInit) => request<T>(path, { headers }),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const streamUrl = (path: string) => `/api${path}`;
