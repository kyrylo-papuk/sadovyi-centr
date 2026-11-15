import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const TOKEN_KEY = "sc-admin-token";
const AdminContext = createContext(null);

export const useAdmin = () => useContext(AdminContext);

export const STATUS = { new: "Нове", confirmed: "Підтверджене", shipped: "Відправлене", done: "Виконане", cancelled: "Скасоване" };
export const STATUS_FILTER = { new: "Нові", confirmed: "Підтверджені", shipped: "Відправлені", done: "Виконані", cancelled: "Скасовані" };

const ERRORS = {
  wrong_password: "Невірний пароль",
  too_many_attempts: "Забагато спроб. Спробуйте через 15 хвилин.",
  name: "Вкажіть назву",
  cat: "Оберіть категорію",
  price: "Вкажіть ціну",
  too_large: "Файл завеликий",
  type: "Цей формат фото не підтримується — оберіть JPG або PNG",
  network: "Немає зв'язку з сервером. Перевірте інтернет.",
};
export const errText = (e) => ERRORS[e?.code] || "Щось пішло не так. Спробуйте ще раз.";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Стан кабінету: вхід, замовлення, рослини, спливаючі повідомлення.
export function AdminProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [orders, setOrders] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [toastMsg, setToastMsg] = useState(null); // { text, isError }
  const lastNewCount = useRef(null);

  const toast = useCallback((text, isError = false) => setToastMsg({ text, isError }), []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* нічого */ }
    setToken(null);
    setOrders([]);
    setProducts([]);
    lastNewCount.current = null;
  }, []);

  const login = useCallback(async (password) => {
    const d = await api("/admin/login", { method: "POST", json: { password } });
    try { localStorage.setItem(TOKEN_KEY, d.token); } catch { /* нічого */ }
    setToken(d.token);
  }, []);

  // запит від імені власниці; якщо вхід застарів — повертаємо на екран пароля
  const call = useCallback(
    async (path, opts = {}) => {
      try {
        return await api(path, { ...opts, token });
      } catch (e) {
        if (e.code === "unauthorized") logout();
        throw e;
      }
    },
    [token, logout],
  );

  // quiet — фонове оновлення: помилки не показуємо, а про нове замовлення сповіщаємо
  const refreshOrders = useCallback(
    async (quiet = false) => {
      try {
        const d = await call("/admin/orders");
        const fresh = d.counts.new || 0;
        if (quiet && lastNewCount.current !== null && fresh > lastNewCount.current) toast("🌱 Нове замовлення!");
        lastNewCount.current = fresh;
        setOrders(d.orders);
        setNewCount(fresh);
      } catch (e) {
        if (!quiet && e.code !== "unauthorized") toast(errText(e), true);
      }
    },
    [call, toast],
  );

  const refreshProducts = useCallback(async () => {
    try {
      const d = await call("/admin/products");
      setProducts(d.products);
      return d.products;
    } catch (e) {
      if (e.code !== "unauthorized") toast(errText(e), true);
      return null;
    }
  }, [call, toast]);

  const value = { token, login, logout, call, toast, toastMsg, orders, newCount, refreshOrders, products, refreshProducts };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
