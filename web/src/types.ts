// Типи даних, якими сайт обмінюється з API.

export interface Category {
  id: string;
  name: string;
  img?: string; // фото плитки
  also?: string[]; // які ще категорії показувати разом із цією
}

/** Характеристика рослини: [назва, значення] */
export type Spec = [string, string];

/** Рослина, як її бачить покупець */
export interface Product {
  id: number;
  cat: string;
  name: string;
  note: string;
  price: number;
  old: number | null; // стара ціна — якщо є, показуємо знижку
  stock: boolean; // true — є в наявності, false — передзамовлення
  images: string[];
  desc: string[];
  specs: Spec[];
}

/** Рослина в кабінеті: разом із прихованими */
export interface AdminProduct extends Product {
  visible: boolean;
  sort: number;
  updated_at?: string | null;
}

/** Дані рослини, які кабінет надсилає на збереження */
export type ProductInput = Omit<AdminProduct, "id" | "sort" | "updated_at">;

export type OrderStatus = "new" | "confirmed" | "shipped" | "done" | "cancelled";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  img?: string; // фото на момент замовлення (у старих замовленнях його немає)
}

/** Рядок у списку замовлень */
export interface OrderRow {
  id: number;
  num: string | null;
  created_at: string;
  status: OrderStatus;
  name: string;
  phone: string;
  city: string;
  total: number;
  count: number;
}

/** Замовлення повністю */
export interface Order {
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
  admin_note: string;
  items: OrderItem[];
  total: number;
}

/** Замовлення, яке покупець надсилає з сайту */
export interface NewOrder {
  first: string;
  name: string;
  phone: string;
  email: string;
  delivery: { type: string; city: string; np: string };
  note: string;
  items: OrderItem[];
  total: number;
  website: string; // пастка для ботів
  num?: string; // номер, який видав сервер
}

// Відповіді API
export interface ProductsResponse { products: Product[] }
export interface AdminProductsResponse { products: AdminProduct[] }
export interface OrderCreatedResponse { num: string; total?: number }
export interface LoginResponse { token: string }
export interface OrdersResponse { orders: OrderRow[]; counts: Partial<Record<OrderStatus, number>> }
export interface OrderResponse { order: Order }
export interface ImageResponse { src: string }
