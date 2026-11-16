// API «Сімейного садового центру» (Cloudflare Worker + база D1).
//
// Публічне:
//   GET    /products              — каталог для сайту (лише видимі)
//   GET    /img/:id               — фото, завантажене через кабінет
//   POST   /order                 — нове замовлення з сайту
// Кабінет (заголовок Authorization: Bearer <token>):
//   POST   /admin/login           — {password} → {token}
//   GET    /admin/products        — усі рослини, разом із прихованими
//   POST   /admin/products        — додати рослину
//   PUT    /admin/products/:id    — змінити рослину
//   DELETE /admin/products/:id    — видалити рослину
//   POST   /admin/images          — завантажити фото (тіло — сам файл) → {src}
//   GET    /admin/orders          — список замовлень + кількість за статусами
//   GET    /admin/orders/:id      — одне замовлення
//   PATCH  /admin/orders/:id      — {status, admin_note}
//
// Секрети (wrangler secret put): ADMIN_PASSWORD; необов'язково BOT_TOKEN і CHAT_ID для Telegram.
// Змінні (wrangler.toml): ALLOWED_ORIGINS, ADMIN_URL.

/* ---------- типи ---------- */

interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  ADMIN_URL?: string;
  ADMIN_PASSWORD?: string;
  BOT_TOKEN?: string;
  CHAT_ID?: string;
}

/** Довільний JSON-об'єкт із запиту: поля перевіряємо самі */
type Json = Record<string, unknown>;

type Spec = [string, string];

const STATUSES = ["new", "confirmed", "shipped", "done", "cancelled"] as const;
type OrderStatus = (typeof STATUSES)[number];
const isStatus = (v: unknown): v is OrderStatus => STATUSES.includes(v as OrderStatus);

/** Рядок таблиці products */
interface ProductRow {
  id: number;
  cat: string;
  name: string;
  note: string;
  price: number;
  old_price: number | null;
  stock: number;
  visible: number;
  images: string; // JSON
  descr: string; // JSON
  specs: string; // JSON
  sort: number;
  updated_at: string | null;
}

interface Product {
  id: number;
  cat: string;
  name: string;
  note: string;
  price: number;
  old: number | null;
  stock: boolean;
  visible: boolean;
  images: string[];
  desc: string[];
  specs: Spec[];
  sort: number;
  updated_at: string | null;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  img: string;
}

/** Рядок таблиці orders */
interface OrderRow {
  id: number;
  num: string | null;
  created_at: string;
  status: OrderStatus;
  name: string;
  phone: string;
  email: string;
  delivery_type: string;
  city: string;
  np: string;
  note: string;
  items: string; // JSON
  total: number;
  admin_note: string;
}

/** Замовлення для сповіщення в Telegram */
interface OrderNotice {
  id: number;
  num: string;
  name: string;
  phone: string;
  email: string;
  delivery: { type: string; city: string; np: string };
  note: string;
  items: OrderItem[];
  total: number;
}

/* ---------- налаштування ---------- */

const MAX_IMAGE = 1_500_000;
const SESSION_DAYS = 30;
const LOGIN_LIMIT = 10; // невдалих спроб
const LOGIN_WINDOW = 15 * 60_000; // за 15 хвилин

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

function fail(status: number, code: string): never {
  throw new HttpError(status, code);
}

const list = (v: string | undefined): string[] => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const allowed = list(env.ALLOWED_ORIGINS);
    const originOk = allowed.includes(origin);
    const cors: Record<string, string> = {
      "Access-Control-Allow-Origin": originOk ? origin : allowed[0] || "",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    let res: Response;
    try {
      res = await route(request, env, ctx, originOk);
    } catch (e) {
      if (e instanceof HttpError) {
        res = json(e.status, { ok: false, error: e.code });
      } else {
        console.error(e);
        res = json(500, { ok: false, error: "server" });
      }
    }
    res = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env, ctx: ExecutionContext, originOk: boolean): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const m = request.method;
  let r: RegExpMatchArray | null;

  if (m === "GET" && path === "/products") return getPublicProducts(env);
  if (m === "GET" && (r = path.match(/^\/img\/([a-f0-9]{32})$/))) return getImage(r[1]!, request, env, ctx);
  if (m === "POST" && path === "/order") {
    if (!originOk) fail(403, "origin");
    return createOrder(request, env, ctx);
  }
  if (m === "POST" && path === "/admin/login") return login(request, env);

  if (path.startsWith("/admin/")) {
    await requireAdmin(request, env);
    if (m === "GET" && path === "/admin/products") return json(200, { ok: true, products: await allProducts(env) });
    if (m === "POST" && path === "/admin/products") return saveProduct(request, env, null);
    if ((r = path.match(/^\/admin\/products\/(\d+)$/))) {
      if (m === "PUT") return saveProduct(request, env, Number(r[1]));
      if (m === "DELETE") return deleteProduct(env, Number(r[1]));
    }
    if (m === "POST" && path === "/admin/images") return uploadImage(request, env);
    if (m === "GET" && path === "/admin/orders") return listOrders(env, url);
    if ((r = path.match(/^\/admin\/orders\/(\d+)$/))) {
      if (m === "GET") return getOrder(env, Number(r[1]));
      if (m === "PATCH") return updateOrder(request, env, Number(r[1]));
    }
  }
  fail(404, "not_found");
}

/* ---------- допоміжне ---------- */

async function readJson(request: Request, max = 50_000): Promise<Json> {
  const raw = await request.text();
  if (raw.length > max) fail(413, "too_large");
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    fail(400, "bad_json");
  }
  if (!v || typeof v !== "object") fail(400, "bad_json");
  return v as Json;
}

/** Один рядок тексту без зайвих пробілів, обрізаний до max */
const line = (v: unknown, max = 200): string => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
/** Багаторядковий текст, обрізаний до max */
const block = (v: unknown, max = 1000): string =>
  String(v ?? "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
/** Ціле число в межах [min, max] або null */
const int = (v: unknown, min: number, max: number): number | null => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const parse = <T>(s: string, dflt: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return dflt;
  }
};
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObject = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
/** id фото, які лежать у нашій базі (а не файли сайту) */
const ownImageIds = (images: string[]): string[] =>
  images.flatMap((s) => String(s).match(/^\/img\/([a-f0-9]{32})$/)?.[1] ?? []);
const placeholders = (n: number): string => Array.from({ length: n }, () => "?").join(",");

/* ---------- рослини ---------- */

const rowToProduct = (r: ProductRow): Product => ({
  id: r.id, cat: r.cat, name: r.name, note: r.note, price: r.price, old: r.old_price || null,
  stock: !!r.stock, visible: !!r.visible,
  images: parse<string[]>(r.images, []), desc: parse<string[]>(r.descr, []), specs: parse<Spec[]>(r.specs, []),
  sort: r.sort, updated_at: r.updated_at,
});

async function allProducts(env: Env): Promise<Product[]> {
  const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY sort, id").all<ProductRow>();
  return results.map(rowToProduct);
}

async function getPublicProducts(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare("SELECT * FROM products WHERE visible = 1 ORDER BY sort, id").all<ProductRow>();
  // покупцю службові поля не потрібні
  const products = results.map(rowToProduct).map(({ visible: _v, sort: _s, updated_at: _u, ...p }) => p);
  // no-cache: після правок у кабінеті сайт одразу показує нові дані
  return json(200, { ok: true, products }, { "Cache-Control": "no-cache" });
}

function cleanProduct(o: Json) {
  const name = line(o.name, 150);
  const cat = line(o.cat, 30);
  const price = int(o.price, 0, 1_000_000);
  if (!name) fail(400, "name");
  if (!/^[a-z0-9-]+$/.test(cat)) fail(400, "cat");
  if (price === null) fail(400, "price");
  const old = o.old === null || o.old === "" || o.old === undefined ? null : int(o.old, 1, 1_000_000);
  const images = asArray(o.images)
    .map((s) => line(s, 300))
    .filter((s) => /^\/img\/[a-f0-9]{32}$/.test(s) || /^img\/[\w.-]+$/.test(s))
    .slice(0, 10);
  const desc = asArray(o.desc).map((s) => block(s, 2000)).filter(Boolean).slice(0, 20);
  const specs = asArray(o.specs)
    .filter((x): x is unknown[] => Array.isArray(x))
    .map(([k, v]): Spec => [line(k, 80), line(v, 200)])
    .filter(([k, v]) => k && v)
    .slice(0, 30);
  return {
    name, cat, price, old: old && old > price ? old : null,
    note: line(o.note, 200), stock: o.stock ? 1 : 0, visible: o.visible === false ? 0 : 1,
    images, desc, specs,
    // null — не змінювати порядок (а нову рослину поставити в кінець)
    sort: o.sort === undefined || o.sort === null ? null : int(o.sort, -1_000_000, 1_000_000),
  };
}

async function saveProduct(request: Request, env: Env, id: number | null): Promise<Response> {
  const p = cleanProduct(await readJson(request));
  const now = new Date().toISOString();
  const vals = [p.cat, p.name, p.note, p.price, p.old, p.stock, p.visible,
    JSON.stringify(p.images), JSON.stringify(p.desc), JSON.stringify(p.specs), p.sort, now];
  let row: ProductRow | null;
  if (id === null) {
    // нова рослина без явного порядку стає в кінець каталогу
    row = await env.DB.prepare(`INSERT INTO products (cat, name, note, price, old_price, stock, visible, images, descr, specs, sort, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM products)), ?) RETURNING *`)
      .bind(...vals).first<ProductRow>();
  } else {
    const prev = await env.DB.prepare("SELECT images FROM products WHERE id = ?").bind(id).first<{ images: string }>();
    if (!prev) fail(404, "not_found");
    row = await env.DB.prepare(`UPDATE products SET cat = ?, name = ?, note = ?, price = ?, old_price = ?, stock = ?, visible = ?,
      images = ?, descr = ?, specs = ?, sort = COALESCE(?, sort), updated_at = ? WHERE id = ? RETURNING *`)
      .bind(...vals, id).first<ProductRow>();
    // фото, які прибрали з рослини, видаляємо з бази
    const kept = ownImageIds(p.images);
    const removed = ownImageIds(parse<string[]>(prev.images, [])).filter((x) => !kept.includes(x));
    await deleteImages(env, removed);
  }
  if (!row) fail(500, "server");
  return json(200, { ok: true, product: rowToProduct(row) });
}

async function deleteProduct(env: Env, id: number): Promise<Response> {
  const prev = await env.DB.prepare("DELETE FROM products WHERE id = ? RETURNING images").bind(id).first<{ images: string }>();
  if (!prev) fail(404, "not_found");
  await deleteImages(env, ownImageIds(parse<string[]>(prev.images, [])));
  return json(200, { ok: true });
}

/* ---------- фото ---------- */

async function deleteImages(env: Env, ids: string[]): Promise<void> {
  if (!ids.length) return;
  await env.DB.prepare(`DELETE FROM images WHERE id IN (${placeholders(ids.length)})`).bind(...ids).run();
}

async function uploadImage(request: Request, env: Env): Promise<Response> {
  const type = (request.headers.get("Content-Type") || "").split(";")[0]!.trim();
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) fail(415, "type");
  const data = await request.arrayBuffer();
  if (!data.byteLength) fail(400, "empty");
  if (data.byteLength > MAX_IMAGE) fail(413, "too_large");
  const id = crypto.randomUUID().replace(/-/g, "");
  await env.DB.prepare("INSERT INTO images (id, type, data, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, type, data, new Date().toISOString()).run();
  return json(200, { ok: true, src: "/img/" + id });
}

async function getImage(id: string, request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const row = await env.DB.prepare("SELECT type, data FROM images WHERE id = ?").bind(id)
    .first<{ type: string; data: ArrayBuffer | number[] }>();
  if (!row) fail(404, "not_found");
  const bytes = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
  const res = new Response(bytes, {
    headers: { "Content-Type": row.type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
  ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}

/* ---------- замовлення ---------- */

async function createOrder(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const o = await readJson(request, 20_000);
  if (o.website) return json(200, { ok: true, num: "" }); // пастка для ботів

  const name = line(o.name, 100);
  const phone = line(o.phone, 30);
  if (!name || phone.replace(/\D/g, "").length < 10) fail(400, "contact");

  // ціни й назви беремо з бази, а не з браузера
  const wanted = new Map<number, number>();
  for (const raw of asArray(o.items).slice(0, 50)) {
    const item = asObject(raw);
    const id = int(item.id, 1, 1e9);
    const qty = int(item.qty, 1, 999);
    if (id && qty) wanted.set(id, (wanted.get(id) || 0) + qty);
  }
  if (!wanted.size) fail(400, "items");
  const ids = [...wanted.keys()];
  const { results } = await env.DB.prepare(`SELECT id, name, price, images FROM products WHERE id IN (${placeholders(ids.length)})`)
    .bind(...ids).all<Pick<ProductRow, "id" | "name" | "price" | "images">>();
  // img — головне фото на момент замовлення, щоб у кабінеті було видно, що саме замовили
  const items: OrderItem[] = results.map((p) => ({
    id: p.id, name: p.name, price: p.price, qty: wanted.get(p.id) ?? 1, img: parse<string[]>(p.images, [])[0] || "",
  }));
  if (!items.length) fail(400, "items");
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const d = asObject(o.delivery);
  const email = line(o.email, 120);
  const delivery = { type: line(d.type, 40), city: line(d.city, 100), np: line(d.np, 150) };
  const note = block(o.note);
  const now = new Date();
  const row = await env.DB.prepare(`INSERT INTO orders (created_at, name, phone, email, delivery_type, city, np, note, items, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
    .bind(now.toISOString(), name, phone, email, delivery.type, delivery.city, delivery.np, note, JSON.stringify(items), total)
    .first<{ id: number }>();
  if (!row) fail(500, "server");

  // номер замовлення: СЦ-РРММДД-NNN за київським часом
  const parts = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", year: "2-digit", month: "2-digit", day: "2-digit" })
    .formatToParts(now);
  const part = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  const num = `СЦ-${part("year")}${part("month")}${part("day")}-${String(row.id).padStart(3, "0")}`;
  await env.DB.prepare("UPDATE orders SET num = ? WHERE id = ?").bind(num, row.id).run();

  if (env.BOT_TOKEN && env.CHAT_ID) {
    ctx.waitUntil(notifyTelegram(env, { id: row.id, num, name, phone, email, delivery, note, items, total }));
  }
  return json(200, { ok: true, num, total });
}

async function listOrders(env: Env, url: URL): Promise<Response> {
  const status = url.searchParams.get("status");
  const filtered = isStatus(status);
  const stmt = env.DB.prepare(
    `SELECT id, num, created_at, status, name, phone, city, items, total FROM orders ${filtered ? "WHERE status = ?" : ""} ORDER BY id DESC LIMIT 500`,
  );
  type ListRow = Pick<OrderRow, "id" | "num" | "created_at" | "status" | "name" | "phone" | "city" | "items" | "total">;
  const [{ results }, counts] = await Promise.all([
    (filtered ? stmt.bind(status) : stmt).all<ListRow>(),
    env.DB.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all<{ status: string; n: number }>(),
  ]);
  const orders = results.map(({ items, ...r }) => ({
    ...r,
    count: parse<OrderItem[]>(items, []).reduce((s, i) => s + i.qty, 0),
  }));
  return json(200, { ok: true, orders, counts: Object.fromEntries(counts.results.map((c) => [c.status, c.n])) });
}

const orderFromRow = (r: OrderRow) => ({ ...r, items: parse<OrderItem[]>(r.items, []) });

async function getOrder(env: Env, id: number): Promise<Response> {
  const r = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<OrderRow>();
  if (!r) fail(404, "not_found");
  return json(200, { ok: true, order: orderFromRow(r) });
}

async function updateOrder(request: Request, env: Env, id: number): Promise<Response> {
  const o = await readJson(request);
  const sets: string[] = [];
  const vals: string[] = [];
  if (o.status !== undefined) {
    if (!isStatus(o.status)) fail(400, "status");
    sets.push("status = ?");
    vals.push(o.status);
  }
  if (o.admin_note !== undefined) {
    sets.push("admin_note = ?");
    vals.push(block(o.admin_note, 2000));
  }
  if (!sets.length) fail(400, "nothing");
  const r = await env.DB.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ? RETURNING *`).bind(...vals, id).first<OrderRow>();
  if (!r) fail(404, "not_found");
  return json(200, { ok: true, order: orderFromRow(r) });
}

/* ---------- Telegram (необов'язково) ---------- */

const h = (s: string): string => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const uah = (n: number): string => n.toLocaleString("uk-UA") + " грн";

export function formatOrder(o: OrderNotice, adminUrl?: string): string {
  const d = o.delivery;
  return [
    `🌱 <b>Нове замовлення ${h(o.num)}</b>`,
    "",
    `👤 ${h(o.name)}`,
    `📞 ${h(o.phone)}`,
    o.email ? `✉️ ${h(o.email)}` : null,
    `🚚 ${h([d.type, d.city, d.np].filter(Boolean).join(", "))}`,
    o.note ? `📝 ${h(o.note)}` : null,
    "",
    "<b>Товари:</b>",
    ...o.items.map((i) => `• ${h(i.name)} — ${i.qty} шт × ${uah(i.price)} = ${uah(i.qty * i.price)}`),
    "",
    `<b>Разом: ${uah(o.total)}</b>`,
    adminUrl ? `\n<a href="${h(adminUrl)}/orders/${o.id}">Відкрити в кабінеті</a>` : null,
  ].filter((x): x is string => x !== null).join("\n");
}

async function notifyTelegram(env: Env, order: OrderNotice): Promise<void> {
  const text = formatOrder(order, env.ADMIN_URL);
  await Promise.all(
    list(env.CHAT_ID).map((chat_id) =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
      }).catch((e: unknown) => console.error("telegram", e)),
    ),
  );
}

/* ---------- вхід у кабінет ---------- */

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Пароль кабінету; без нього сервер не налаштований */
function adminPassword(env: Env): string {
  if (!env.ADMIN_PASSWORD) fail(500, "not_configured");
  return env.ADMIN_PASSWORD;
}

async function sessionKey(env: Env): Promise<CryptoKey> {
  // ключ залежить від пароля: після зміни пароля всі старі входи стають недійсними
  const raw = await crypto.subtle.digest("SHA-256", enc.encode("sc-admin-session|" + adminPassword(env)));
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

const sign = async (key: CryptoKey, data: string): Promise<string> =>
  b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));

/** Порівняння секретів за сталий час (не видає, на якому символі відмінність) */
async function sameSecret(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(String(s)))));
  const ua = new Uint8Array(x!);
  const ub = new Uint8Array(y!);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i]! ^ ub[i]!;
  return diff === 0;
}

async function login(request: Request, env: Env): Promise<Response> {
  const key = await sessionKey(env);
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const now = Date.now();
  await env.DB.prepare("DELETE FROM login_attempts WHERE ts < ?").bind(now - LOGIN_WINDOW).run();
  const attempts = await env.DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ?").bind(ip).first<{ n: number }>();
  if ((attempts?.n ?? 0) >= LOGIN_LIMIT) fail(429, "too_many_attempts");

  const { password } = await readJson(request, 2000);
  if (!(await sameSecret(typeof password === "string" ? password : "", adminPassword(env)))) {
    await env.DB.prepare("INSERT INTO login_attempts (ip, ts) VALUES (?, ?)").bind(ip, now).run();
    fail(401, "wrong_password");
  }
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
  const payload = b64url(enc.encode(JSON.stringify({ exp: now + SESSION_DAYS * 86400_000 })));
  return json(200, { ok: true, token: payload + "." + (await sign(key, payload)) });
}

async function requireAdmin(request: Request, env: Env): Promise<void> {
  const key = await sessionKey(env);
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !(await sameSecret(sig, await sign(key, payload)))) fail(401, "unauthorized");
  let data: { exp?: number } | null;
  try {
    data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number } | null;
  } catch {
    fail(401, "unauthorized");
  }
  if (!data || !(Number(data.exp) > Date.now())) fail(401, "expired");
}
