import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api, errorCode } from "../lib/api";
import type { ApiOptions } from "../lib/api";
import type { AdminProduct, AdminProductsResponse, LoginResponse, OrderRow, OrderStatus, OrdersResponse } from "../types";

const TOKEN_KEY = "sc-admin-token";

export const STATUS: Record<OrderStatus, string> = {
  new: "Нове", confirmed: "Підтверджене", shipped: "Відправлене", done: "Виконане", cancelled: "Скасоване",
};
export const STATUS_FILTER: Record<OrderStatus, string> = {
  new: "Нові", confirmed: "Підтверджені", shipped: "Відправлені", done: "Виконані", cancelled: "Скасовані",
};
export const STATUSES = Object.keys(STATUS) as OrderStatus[];

const ERRORS: Record<string, string> = {
  wrong_password: "Невірний пароль",
  too_many_attempts: "Забагато спроб. Спробуйте через 15 хвилин.",
  name: "Вкажіть назву",
  cat: "Оберіть категорію",
  price: "Вкажіть ціну",
  too_large: "Файл завеликий",
  type: "Цей формат фото не підтримується — оберіть JPG або PNG",
  network: "Немає зв'язку з сервером. Перевірте інтернет.",
};
/** Зрозумілий текст помилки для власниці */
export const errText = (e: unknown): string => ERRORS[errorCode(e)] || "Щось пішло не так. Спробуйте ще раз.";

interface Toast {
  text: string;
  isError: boolean;
}

interface AdminState {
  token: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  /** запит від імені власниці */
  call: <T = unknown>(path: string, options?: ApiOptions) => Promise<T>;
  toast: (text: string, isError?: boolean) => void;
  toastMsg: Toast | null;
  orders: OrderRow[];
  newCount: number;
  refreshOrders: (quiet?: boolean) => Promise<void>;
  products: AdminProduct[];
  refreshProducts: () => Promise<AdminProduct[] | null>;
}

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin(): AdminState {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error("useAdmin можна викликати лише всередині <AdminProvider>");
  return admin;
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Стан кабінету: вхід, замовлення, рослини, спливаючі повідомлення.
export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [toastMsg, setToastMsg] = useState<Toast | null>(null);
  const lastNewCount = useRef<number | null>(null);

  const toast = useCallback((text: string, isError = false) => setToastMsg({ text, isError }), []);
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

  const login = useCallback(async (password: string) => {
    const d = await api<LoginResponse>("/admin/login", { method: "POST", json: { password } });
    try { localStorage.setItem(TOKEN_KEY, d.token); } catch { /* нічого */ }
    setToken(d.token);
  }, []);

  // якщо вхід застарів — повертаємо на екран пароля
  const call = useCallback(
    async <T = unknown,>(path: string, options: ApiOptions = {}): Promise<T> => {
      try {
        return await api<T>(path, { ...options, token });
      } catch (e) {
        if (errorCode(e) === "unauthorized") logout();
        throw e;
      }
    },
    [token, logout],
  );

  // quiet — фонове оновлення: помилки не показуємо, а про нове замовлення сповіщаємо
  const refreshOrders = useCallback(
    async (quiet = false) => {
      try {
        const d = await call<OrdersResponse>("/admin/orders");
        const fresh = d.counts.new || 0;
        if (quiet && lastNewCount.current !== null && fresh > lastNewCount.current) toast("🌱 Нове замовлення!");
        lastNewCount.current = fresh;
        setOrders(d.orders);
        setNewCount(fresh);
      } catch (e) {
        if (!quiet && errorCode(e) !== "unauthorized") toast(errText(e), true);
      }
    },
    [call, toast],
  );

  const refreshProducts = useCallback(async () => {
    try {
      const d = await call<AdminProductsResponse>("/admin/products");
      setProducts(d.products);
      return d.products;
    } catch (e) {
      if (errorCode(e) !== "unauthorized") toast(errText(e), true);
      return null;
    }
  }, [call, toast]);

  const value: AdminState = { token, login, logout, call, toast, toastMsg, orders, newCount, refreshOrders, products, refreshProducts };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
