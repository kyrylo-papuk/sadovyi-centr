import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PRODUCTS, mockApi, renderApp } from "../test/helpers.jsx";

const cartCount = () => screen.getByTestId("cart-count").textContent;
const cards = () => screen.queryAllByRole("article");

async function fillForm(user, phone = "067 123 45 67") {
  const dialog = screen.getByRole("dialog", { name: "Оформлення замовлення" });
  const field = (name) => dialog.querySelector(`[name="${name}"]`);
  await user.type(field("first"), "Олена");
  await user.type(field("last"), "Коваленко");
  await user.type(field("phone"), phone);
  await user.type(field("email"), "olena@example.com");
  await user.type(field("city"), "Вінниця");
  await user.type(field("np"), "12");
  return dialog;
}

describe("каталог", () => {
  it("показує рослини з API і фільтрує за категорією", async () => {
    mockApi({ "GET /products": () => ({ ok: true, products: PRODUCTS }) });
    const user = userEvent.setup();
    renderApp("/");

    expect(await screen.findByText("Троянда «Піано»")).toBeInTheDocument();
    expect(cards()).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Троянди" }));
    expect(cards()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Ягоди" }));
    expect(cards()).toHaveLength(1);
    expect(screen.getByText("Полуниця «Альбіон», 5 розеток")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Акційні/ }));
    expect(cards()).toHaveLength(1);
    expect(screen.getByText("−12%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Горіхи" }));
    expect(screen.getByText("У цій категорії поки немає товарів.")).toBeInTheDocument();
  });

  it("якщо API недоступний — просить зателефонувати", async () => {
    mockApi({ "GET /products": () => [500, { ok: false, error: "server" }] });
    renderApp("/");
    expect(await screen.findByText(/Не вдалося завантажити каталог/)).toBeInTheDocument();
  });
});

describe("сторінка рослини", () => {
  it("показує опис і додає вибрану кількість у кошик", async () => {
    mockApi({ "GET /products": () => ({ ok: true, products: PRODUCTS }) });
    const user = userEvent.setup();
    renderApp("/product/1");

    expect(await screen.findByRole("heading", { level: 1, name: "Троянда «Піано»" })).toBeInTheDocument();
    expect(screen.getByText("Опис троянди.")).toBeInTheDocument();
    expect(screen.getByText("Висота")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Схожі саджанці" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Більше" }));
    await user.click(screen.getByRole("button", { name: "Більше" }));
    await user.click(screen.getByRole("button", { name: "Додати в кошик" }));
    expect(cartCount()).toBe("3");
    expect(screen.getByText("✓ Додано в кошик: 3 шт")).toBeInTheDocument();
  });

  it("невідома рослина — зрозуміле повідомлення", async () => {
    mockApi({ "GET /products": () => ({ ok: true, products: PRODUCTS }) });
    renderApp("/product/999");
    expect(await screen.findByText("Такої рослини немає")).toBeInTheDocument();
  });
});

describe("кошик і замовлення", () => {
  it("не дає оформити замовлення менше мінімальної суми", async () => {
    mockApi({ "GET /products": () => ({ ok: true, products: PRODUCTS }) });
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByText("Троянда «Піано»");

    await user.click(within(cards()[0]).getByRole("button", { name: "У кошик" }));
    expect(cartCount()).toBe("1");

    await user.click(screen.getByRole("button", { name: "Відкрити кошик" }));
    const drawer = screen.getByRole("dialog", { name: "Кошик" });
    expect(within(drawer).getByText(/Мінімальне замовлення — 300 грн/)).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Оформити замовлення" })).toBeDisabled();

    await user.click(within(drawer).getByRole("button", { name: "Більше" }));
    await user.click(within(drawer).getByRole("button", { name: "Більше" }));
    expect(within(drawer).getByText("Разом:").nextSibling).toHaveTextContent("360 грн");
    expect(within(drawer).getByRole("button", { name: "Оформити замовлення" })).toBeEnabled();

    await user.click(within(drawer).getByRole("button", { name: "Видалити" }));
    expect(within(drawer).getByText("Кошик порожній")).toBeInTheDocument();
    expect(cartCount()).toBe("0");
  });

  it("кошик зберігається між відвідуваннями", async () => {
    localStorage.setItem("sc-cart", JSON.stringify({ 1: 2, 3: 1, 777: 5 }));
    mockApi({ "GET /products": () => ({ ok: true, products: PRODUCTS }) });
    renderApp("/");
    await screen.findByText("Троянда «Піано»");
    // товару 777 в каталозі вже немає — він не рахується
    await waitFor(() => expect(cartCount()).toBe("3"));
  });

  it("надсилає замовлення і показує номер від сервера", async () => {
    localStorage.setItem("sc-cart", JSON.stringify({ 1: 2, 3: 1 }));
    const apiMock = mockApi({
      "GET /products": () => ({ ok: true, products: PRODUCTS }),
      "POST /order": () => ({ ok: true, num: "СЦ-261115-007", total: 390 }),
    });
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByText("Троянда «Піано»");

    await user.click(screen.getByRole("button", { name: "Відкрити кошик" }));
    await user.click(screen.getByRole("button", { name: "Оформити замовлення" }));
    const dialog = await fillForm(user);
    await user.click(within(dialog).getByRole("button", { name: "Надіслати замовлення" }));

    expect(await screen.findByText("Замовлення надіслано!")).toBeInTheDocument();
    expect(screen.getByText("СЦ-261115-007")).toBeInTheDocument();
    expect(cartCount()).toBe("0");

    const sent = apiMock.last("POST", "/order").body;
    expect(sent).toMatchObject({
      name: "Олена Коваленко",
      phone: "+380671234567",
      email: "olena@example.com",
      delivery: { type: "У відділення", city: "Вінниця", np: "12" },
      website: "",
    });
    expect(sent.items).toEqual([
      { id: 1, name: "Троянда «Піано»", qty: 2, price: 120 },
      { id: 3, name: "Полуниця «Альбіон», 5 розеток", qty: 1, price: 150 },
    ]);
  });

  it("не надсилає замовлення з неправильним телефоном", async () => {
    localStorage.setItem("sc-cart", JSON.stringify({ 1: 3 }));
    const apiMock = mockApi({ "GET /products": () => ({ ok: true, products: PRODUCTS }) });
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByText("Троянда «Піано»");

    await user.click(screen.getByRole("button", { name: "Відкрити кошик" }));
    await user.click(screen.getByRole("button", { name: "Оформити замовлення" }));
    const dialog = await fillForm(user, "12345");
    await user.click(within(dialog).getByRole("button", { name: "Надіслати замовлення" }));

    expect(dialog.querySelector('[name="phone"]').validationMessage).toMatch(/Вкажіть номер/);
    expect(apiMock.last("POST", "/order")).toBeUndefined();
  });

  it("якщо сервер недоступний — кошик лишається, можна повторити", async () => {
    localStorage.setItem("sc-cart", JSON.stringify({ 1: 3 }));
    let online = false;
    mockApi({
      "GET /products": () => ({ ok: true, products: PRODUCTS }),
      "POST /order": () => (online ? { ok: true, num: "СЦ-1", total: 360 } : [502, { ok: false, error: "server" }]),
    });
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByText("Троянда «Піано»");

    await user.click(screen.getByRole("button", { name: "Відкрити кошик" }));
    await user.click(screen.getByRole("button", { name: "Оформити замовлення" }));
    const dialog = await fillForm(user);
    await user.click(within(dialog).getByRole("button", { name: "Надіслати замовлення" }));

    expect(await screen.findByText("Не вдалося надіслати замовлення")).toBeInTheDocument();
    expect(cartCount()).toBe("3");

    online = true;
    await user.click(screen.getByRole("button", { name: "Спробувати ще раз" }));
    expect(await screen.findByText("Замовлення надіслано!")).toBeInTheDocument();
    expect(cartCount()).toBe("0");
  });
});
