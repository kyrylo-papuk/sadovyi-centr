import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const CART_KEY = "sc-cart";
const ShopContext = createContext(null);

export const useShop = () => useContext(ShopContext);

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

// Стан магазину: каталог з API, кошик (зберігається в браузері), вибрана категорія.
export function ShopProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [cart, setCart] = useState(loadCart); // { [id]: кількість }
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    api("/products")
      .then((d) => {
        setProducts(d.products);
        setStatus("ready");
      })
      .catch((e) => {
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

  const addToCart = useCallback((id, n = 1) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + n })), []);
  const setQty = useCallback(
    (id, qty) =>
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
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
        .filter((x) => x.product && x.qty > 0),
    [cart, products],
  );
  const total = items.reduce((s, x) => s + x.product.price * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);

  const value = {
    products, status,
    items, total, count, addToCart, setQty, clearCart,
    category, setCategory,
    cartOpen, setCartOpen, checkoutOpen, setCheckoutOpen,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
