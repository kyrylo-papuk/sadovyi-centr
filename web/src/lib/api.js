import { API_URL } from "../config.js";

export class ApiError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// Запит до API. json — тіло у форматі JSON, body — «сире» тіло (фото), token — вхід у кабінет.
// Повертає відповідь сервера або кидає ApiError з кодом помилки ("network", "unauthorized", ...).
export async function api(path, { method = "GET", json, body, headers = {}, token, timeout = 20000 } = {}) {
  headers = { ...headers };
  if (token) headers.Authorization = "Bearer " + token;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body, signal: ctrl.signal });
  } catch {
    throw new ApiError("network");
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/admin/login") throw new ApiError("unauthorized");
  if (!res.ok || !data.ok) throw new ApiError(data.error || "http_" + res.status);
  return data;
}
