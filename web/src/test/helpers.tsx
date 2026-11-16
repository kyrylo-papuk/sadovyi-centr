import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { routes } from "../router";
import type { Product } from "../types";

export const PRODUCTS: Product[] = [
  { id: 1, cat: "roses", name: "Троянда «Піано»", note: "Червона", price: 120, old: null, stock: true, images: ["img/rose2.jpg"], desc: ["Опис троянди."], specs: [["Висота", "1 м"]] },
  { id: 2, cat: "roses", name: "Троянда «Герміона»", note: "Рожева", price: 110, old: 125, stock: true, images: ["img/rose3.jpg"], desc: [], specs: [] },
  { id: 3, cat: "strawberry", name: "Полуниця «Альбіон», 5 розеток", note: "Ремонтантна", price: 150, old: null, stock: false, images: ["/img/0123456789abcdef0123456789abcdef"], desc: [], specs: [] },
];

type Headers = Record<string, string>;
/** Відповідь підставного сервера: об'єкт (статус 200) або [статус, об'єкт] */
type MockResult = object | [status: number, data: object];
// тіло запиту в тестах — довільний JSON, тому any
export type MockHandler = (body: any, request: { headers: Headers }) => MockResult;

interface MockCall {
  method: string;
  path: string;
  body: any;
  headers: Headers;
}

/** Підміняє fetch. handlers: { "GET /products": (тіло, запит) => відповідь }. */
export function mockApi(handlers: Record<string, MockHandler>) {
  const calls: MockCall[] = [];
  const fetchMock = vi.fn(async (url: string | URL, init: RequestInit = {}) => {
    const method = init.method || "GET";
    const path = new URL(url).pathname;
    const headers = (init.headers || {}) as Headers;
    const body: unknown = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    calls.push({ method, path, body, headers });
    const handler = handlers[`${method} ${path}`];
    if (!handler) return new Response(JSON.stringify({ ok: false, error: "not_found" }), { status: 404 });
    const result = handler(body, { headers });
    const [status, data] = Array.isArray(result) ? result : [200, result];
    return new Response(JSON.stringify(data), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    calls,
    /** останній запит із таким методом і шляхом */
    last: (method: string, path: string) => calls.filter((c) => c.method === method && c.path === path).at(-1),
  };
}

export function renderApp(path = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}
