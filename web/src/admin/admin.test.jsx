import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockApi, renderApp } from "../test/helpers.jsx";

const ORDER = {
  id: 5, num: "СЦ-261115-005", created_at: new Date().toISOString(), status: "new",
  name: "Олена Коваленко", phone: "+380671234567", email: "olena@example.com",
  delivery_type: "У відділення", city: "Вінниця", np: "12", note: "Після 18:00", admin_note: "",
  items: [{ id: 1, name: "Троянда «Піано»", price: 120, qty: 3, img: "img/rose2.jpg" }], total: 360,
};
const ORDER_ROW = { id: 5, num: ORDER.num, created_at: ORDER.created_at, status: "new", name: ORDER.name, phone: ORDER.phone, city: "Вінниця", total: 360, count: 3 };
const PLANT = { id: 1, cat: "roses", name: "Троянда «Піано»", note: "Червона", price: 120, old: null, stock: true, visible: true, images: ["img/rose2.jpg"], desc: ["Опис."], specs: [["Висота", "1 м"]], sort: 1 };

// сервер, який пускає тільки з правильним токеном
function adminApi(extra = {}) {
  const guard = (fn) => (body, req) => (req.headers.Authorization === "Bearer good-token" ? fn(body) : [401, { ok: false, error: "unauthorized" }]);
  return mockApi({
    "POST /admin/login": (b) => (b.password === "secret" ? { ok: true, token: "good-token" } : [401, { ok: false, error: "wrong_password" }]),
    "GET /admin/orders": guard(() => ({ ok: true, orders: [ORDER_ROW], counts: { new: 1 } })),
    "GET /admin/orders/5": guard(() => ({ ok: true, order: ORDER })),
    "PATCH /admin/orders/5": guard((b) => ({ ok: true, order: { ...ORDER, ...b } })),
    "GET /admin/products": guard(() => ({ ok: true, products: [PLANT] })),
    ...Object.fromEntries(Object.entries(extra).map(([k, fn]) => [k, guard(fn)])),
  });
}

describe("вхід у кабінет", () => {
  it("без пароля кабінет закритий, неправильний пароль не пускає", async () => {
    adminApi();
    const user = userEvent.setup();
    renderApp("/admin");

    expect(screen.getByRole("heading", { name: "Вхід у кабінет" })).toBeInTheDocument();
    expect(screen.queryByText("Олена Коваленко")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Пароль"), "wrong");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    expect(await screen.findByText("Невірний пароль")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Пароль"));
    await user.type(screen.getByLabelText("Пароль"), "secret");
    await user.click(screen.getByRole("button", { name: "Увійти" }));
    expect(await screen.findByText("Олена Коваленко")).toBeInTheDocument();
    expect(localStorage.getItem("sc-admin-token")).toBe("good-token");
  });

  it("застарілий вхід повертає на екран пароля", async () => {
    localStorage.setItem("sc-admin-token", "old-token");
    adminApi();
    renderApp("/admin");
    expect(await screen.findByRole("heading", { name: "Вхід у кабінет" })).toBeInTheDocument();
    expect(localStorage.getItem("sc-admin-token")).toBeNull();
  });
});

describe("замовлення", () => {
  it("список → картка замовлення → зміна статусу й нотатка", async () => {
    localStorage.setItem("sc-admin-token", "good-token");
    const apiMock = adminApi();
    const user = userEvent.setup();
    renderApp("/admin");

    const row = await screen.findByRole("link", { name: /Олена Коваленко/ });
    expect(within(row).getByText("Нове")).toBeInTheDocument();
    expect(within(row).getByText("360 грн")).toBeInTheDocument();
    await user.click(row);

    expect(await screen.findByText("Замовлення СЦ-261115-005")).toBeInTheDocument();
    expect(screen.getByText("Після 18:00")).toBeInTheDocument();
    expect(screen.getByText(/Троянда «Піано»/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Зателефонувати" })).toHaveAttribute("href", "tel:+380671234567");

    await user.click(screen.getByRole("button", { name: "Підтверджене" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Підтверджене" })).toHaveAttribute("aria-pressed", "true"));
    expect(apiMock.last("PATCH", "/admin/orders/5").body).toEqual({ status: "confirmed" });

    await user.type(screen.getByPlaceholderText(/передзвонила/), "Аванс отримано");
    await user.click(screen.getByRole("button", { name: "Зберегти нотатку" }));
    expect(await screen.findByText("Нотатку збережено")).toBeInTheDocument();
    expect(apiMock.last("PATCH", "/admin/orders/5").body).toEqual({ admin_note: "Аванс отримано" });
  });
});

describe("рослини", () => {
  it("редагування: нова ціна зберігається через API", async () => {
    localStorage.setItem("sc-admin-token", "good-token");
    const apiMock = adminApi({ "PUT /admin/products/1": (b) => ({ ok: true, product: { ...PLANT, ...b } }) });
    const user = userEvent.setup();
    renderApp("/admin/products");

    await user.click(await screen.findByRole("link", { name: /Троянда «Піано»/ }));
    const price = await screen.findByLabelText(/^Ціна, грн/);
    expect(price).toHaveValue(120);
    await user.clear(price);
    await user.type(price, "135");
    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    expect(await screen.findByText("Зміни збережено")).toBeInTheDocument();
    expect(apiMock.last("PUT", "/admin/products/1").body).toMatchObject({
      name: "Троянда «Піано»", cat: "roses", price: 135, old: null, stock: true, visible: true,
      images: ["img/rose2.jpg"], desc: ["Опис."], specs: [["Висота", "1 м"]],
    });
  });

  it("нова рослина: перевіряє поля перед збереженням", async () => {
    localStorage.setItem("sc-admin-token", "good-token");
    const apiMock = adminApi({ "POST /admin/products": (b) => ({ ok: true, product: { ...b, id: 2 } }) });
    vi.stubGlobal("confirm", vi.fn(() => true)); // «зберегти без фото?» — так
    const user = userEvent.setup();
    renderApp("/admin/products/new");

    await user.click(await screen.findByRole("button", { name: "Зберегти" }));
    expect(await screen.findByText("Вкажіть назву")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Назва/), "Гортензія");
    await user.type(screen.getByLabelText(/^Ціна, грн/), "250");
    await user.type(screen.getByLabelText(/^Стара ціна/), "200");
    await user.click(screen.getByRole("button", { name: "Зберегти" }));
    expect(await screen.findByText("Стара ціна має бути більшою за нову")).toBeInTheDocument();
    expect(apiMock.last("POST", "/admin/products")).toBeUndefined();

    await user.clear(screen.getByLabelText(/^Стара ціна/));
    await user.selectOptions(screen.getByLabelText(/^Категорія/), "decor");
    await user.click(screen.getByLabelText("Передзамовлення"));
    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    expect(await screen.findByText("Рослину додано")).toBeInTheDocument();
    expect(apiMock.last("POST", "/admin/products").body).toMatchObject({
      name: "Гортензія", cat: "decor", price: 250, old: null, stock: false, visible: true, images: [],
    });
  });
});
