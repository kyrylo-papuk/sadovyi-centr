import { API_URL } from "../config";

/** Помилка API. code — "network", "unauthorized", "wrong_password", "not_found" тощо. */
export class ApiError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = "ApiError";
    this.code = code;
  }
}

/** Код помилки будь-якого винятку ("" — якщо це не помилка API) */
export const errorCode = (e: unknown): string => (e instanceof ApiError ? e.code : "");

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** тіло у форматі JSON */
  json?: unknown;
  /** «сире» тіло, наприклад фото */
  body?: BodyInit;
  headers?: Record<string, string>;
  /** вхід у кабінет */
  token?: string | null;
  timeout?: number;
}

/** Запит до API. Повертає відповідь сервера або кидає ApiError. */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", json, token, timeout = 20000 } = options;
  const headers: Record<string, string> = { ...options.headers };
  let body = options.body;
  if (token) headers.Authorization = "Bearer " + token;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res: Response;
  try {
    res = await fetch(API_URL + path, { method, headers, body, signal: ctrl.signal });
  } catch {
    throw new ApiError("network");
  } finally {
    clearTimeout(timer);
  }

  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (res.status === 401 && path !== "/admin/login") throw new ApiError("unauthorized");
  if (!res.ok || !data.ok) throw new ApiError(data.error || "http_" + res.status);
  return data as T;
}
