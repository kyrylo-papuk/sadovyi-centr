import { API_URL, CATEGORIES } from "../config.js";

export const money = (n) => Number(n || 0).toLocaleString("uk-UA") + " грн";

export const digits = (s) => String(s).replace(/\D/g, "");

export const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id || "";

export const salePct = (p) => Math.round((1 - p.price / p.old) * 100);

// Чи показувати рослину у вибраній категорії
export function inCategory(product, categoryId) {
  if (categoryId === "all") return true;
  if (categoryId === "sale") return !!product.old;
  const category = CATEGORIES.find((c) => c.id === categoryId) || {};
  return product.cat === categoryId || (category.also || []).includes(product.cat);
}

// Шлях до фото: "/img/<32 символи>" — фото, завантажене через кабінет (лежить в API),
// "img/назва.jpg" — файл самого сайту.
export function imgUrl(src) {
  if (!src) return "";
  if (/^\/img\/[a-f0-9]{32}$/.test(src)) return API_URL + src;
  return "/" + src.replace(/^\//, "");
}

// Український мобільний номер: 0XXXXXXXXX або 380XXXXXXXXX. Повертає +380XXXXXXXXX або null.
export function normalizePhone(input) {
  const d = digits(input);
  if (/^0\d{9}$/.test(d)) return "+38" + d;
  if (/^380\d{9}$/.test(d)) return "+" + d;
  return null;
}

const KYIV = { timeZone: "Europe/Kyiv" };

// "Сьогодні, 15:45" / "Вчора, 09:10" / "03.11.2026, 12:00"
export function when(iso) {
  const d = new Date(iso);
  const day = (x) => x.toLocaleDateString("uk-UA", KYIV);
  const time = d.toLocaleTimeString("uk-UA", { ...KYIV, hour: "2-digit", minute: "2-digit" });
  if (day(d) === day(new Date())) return "Сьогодні, " + time;
  if (day(d) === day(new Date(Date.now() - 86400000))) return "Вчора, " + time;
  return d.toLocaleDateString("uk-UA", { ...KYIV, day: "2-digit", month: "2-digit", year: "numeric" }) + ", " + time;
}
