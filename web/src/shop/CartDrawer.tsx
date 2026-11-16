import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../config";
import { imgUrl, money } from "../lib/format";
import { useShop } from "./ShopContext";

// Кошик: висувна панель праворуч
export default function CartDrawer() {
  const { items, total, setQty, setCartOpen, setCheckoutOpen } = useShop();
  const navigate = useNavigate();
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => setCartOpen(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCartOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setCartOpen]);

  const tooSmall = total < CONFIG.minOrder;

  return (
    <>
      <div className="overlay" onClick={close} />
      <aside className="drawer" aria-label="Кошик" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <h2>Ваше замовлення</h2>
          <button className="x" ref={closeRef} aria-label="Закрити кошик" onClick={close}>×</button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty">
              <p style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>Кошик порожній</p>
              <p style={{ marginTop: 8 }}>Оберіть саджанці в каталозі та натисніть «У кошик».</p>
              <button className="btn btn-main" style={{ marginTop: 20 }} onClick={() => { close(); navigate("/#catalog"); }}>До каталогу</button>
            </div>
          ) : (
            <>
              {items.map(({ product: p, qty }) => (
                <div className="line" key={p.id}>
                  <img src={imgUrl(p.images[0])} alt="" />
                  <div>
                    <div className="line-name">{p.name}</div>
                    <div className="line-row">
                      <div className="qty">
                        <button aria-label="Менше" onClick={() => setQty(p.id, qty - 1)}>−</button>
                        <output>{qty}</output>
                        <button aria-label="Більше" onClick={() => setQty(p.id, qty + 1)}>+</button>
                      </div>
                      <span className="line-sum">{money(p.price * qty)}</span>
                    </div>
                    <button className="remove" onClick={() => setQty(p.id, 0)}>Видалити</button>
                  </div>
                </div>
              ))}
              <div className="total"><span>Разом:</span><span>{money(total)}</span></div>
              {tooSmall && (
                <p className="warn">
                  Мінімальне замовлення — {money(CONFIG.minOrder)}. Додайте ще товарів на {money(CONFIG.minOrder - total)}.
                </p>
              )}
              <button className="btn btn-gold" id="toCheckout" type="button" disabled={tooSmall} onClick={() => { close(); setCheckoutOpen(true); }}>
                Оформити замовлення
              </button>
              <p className="small">Аванс {money(CONFIG.prepay)}, решта — при отриманні на Новій Пошті.</p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
