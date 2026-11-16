import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { Product, ProductsResponse } from "../types";

const CART_KEY = "sc-cart";

/** Кошик: id рослини → кількість */
type Cart = Record<string, number>;

export interface CartLine {
  product: Product;
  qty: number;
}

interface ShopState {
  products: Product[];
  status: "loading" | "ready" | "error";
  items: CartLine[];
  total: number;
  count: number;
  addToCart: (id: number, n?: number) => void;
  setQty: (id: number, qty: number) => void;
  clearCart: () => void;
  category: string;
  setCategory: (id: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
}

const ShopContext = createContext<ShopState | null>(null);

export function useShop(): ShopState {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop можна викликати лише всередині <ShopProvider>");
  return shop;
}

function loadCart(): Cart {
  try {
    return (JSON.parse(localStorage.getItem(CART_KEY) || "{}") as Cart) || {};
  } catch {
    return {};
  }
}

// Стан магазину: каталог з API, кошик (зберігається в браузері), вибрана категорія.
export function ShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<ShopState["status"]>("loading");
  const [cart, setCart] = useState<Cart>(loadCart);
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    api<ProductsResponse>("/products")
      .then((d) => {
        setProducts(d.products);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        console.warn("Каталог не завантажився:", e);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* приватний режим браузера — кошик живе до закриття вкладки */
    }
  }, [cart]);

  const addToCart = useCallback((id: number, n = 1) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + n })), []);
  const setQty = useCallback(
    (id: number, qty: number) =>
      setCart((c) => {
        const next = { ...c };
        if (qty > 0) next[id] = qty;
        else delete next[id];
        return next;
      }),
    [],
  );
  const clearCart = useCallback(() => setCart({}), []);

  // у кошику лишаються тільки ті товари, що є в каталозі
  const items = useMemo(
    () =>
      Object.entries(cart).flatMap(([id, qty]): CartLine[] => {
        const product = products.find((p) => p.id === Number(id));
        return product && qty > 0 ? [{ product, qty }] : [];
      }),
    [cart, products],
  );
  const total = items.reduce((s, x) => s + x.product.price * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);

  const value: ShopState = {
    products, status,
    items, total, count, addToCart, setQty, clearCart,
    category, setCategory,
    cartOpen, setCartOpen, checkoutOpen, setCheckoutOpen,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
