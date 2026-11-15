import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { routes } from "../router.jsx";

export const PRODUCTS = [
  { id: 1, cat: "roses", name: "Троянда «Піано»", note: "Червона", price: 120, old: null, stock: true, images: ["img/rose2.jpg"], desc: ["Опис троянди."], specs: [["Висота", "1 м"]] },
  { id: 2, cat: "roses", name: "Троянда «Герміона»", note: "Рожева", price: 110, old: 125, stock: true, images: ["img/rose3.jpg"], desc: [], specs: [] },
  { id: 3, cat: "strawberry", name: "Полуниця «Альбіон», 5 розеток", note: "Ремонтантна", price: 150, old: null, stock: false, images: ["/img/0123456789abcdef0123456789abcdef"], desc: [], specs: [] },
];

// Підміняє fetch. handlers: { "GET /products": (тіло, запит) => відповідь }.
// Відповідь — об'єкт (статус 200) або [статус, об'єкт].
export function mockApi(handlers) {
  const calls = [];
  const fetchMock = vi.fn(async (url, init = {}) => {
    const method = init.method || "GET";
    const path = new URL(url).pathname;
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    calls.push({ method, path, body, headers: init.headers || {} });
    const handler = handlers[`${method} ${path}`];
    if (!handler) return new Response(JSON.stringify({ ok: false, error: "not_found" }), { status: 404 });
    const result = handler(body, { headers: init.headers || {} });
    const [status, data] = Array.isArray(result) ? result : [200, result];
    return new Response(JSON.stringify(data), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, last: (method, path) => calls.filter((c) => c.method === method && c.path === path).at(-1) };
}

export function renderApp(path = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}
