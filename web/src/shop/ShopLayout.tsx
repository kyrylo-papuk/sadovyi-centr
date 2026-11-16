import { useEffect, useState } from "react";
import { Link, Outlet, ScrollRestoration } from "react-router-dom";
import "../styles/shop.css";
import { CONFIG, SITE_NAME, TEL_LINK, VIBER_LINK } from "../config";
import { ShopProvider, useShop } from "./ShopContext";
import CartDrawer from "./CartDrawer";
import Checkout from "./Checkout";

const NAV = [
  ["/#catalog", "Каталог"],
  ["/#how", "Як замовити"],
  ["/#delivery", "Доставка й оплата"],
  ["/#faq", "Питання"],
  ["/#contacts", "Контакти"],
];

function Header() {
  const { count, setCartOpen } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site">
      <div className="wrap head-row">
        <Link className="brand" to="/#top" aria-label={SITE_NAME + " — на головну"}>
          <img src="/img/logo-mark.jpg" alt="" />
          <span><b>Сімейний</b><small>садовий центр</small></span>
        </Link>
        <nav className={"main" + (menuOpen ? " open" : "")} id="nav" aria-label="Головне меню" onClick={() => setMenuOpen(false)}>
          {NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>
        <a className="head-phone" href={TEL_LINK}>
          <span>Приймаємо замовлення 9:00–20:00</span>
          <b>{CONFIG.phone}</b>
        </a>
        <button className="menu-btn" aria-expanded={menuOpen} aria-controls="nav" onClick={() => setMenuOpen((o) => !o)}>Меню</button>
        <button className="cart-btn" aria-label="Відкрити кошик" onClick={() => setCartOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>
          <span className="cart-label">Кошик</span>
          <span className="cart-count" data-testid="cart-count">{count}</span>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <b>{SITE_NAME}</b>
        <nav aria-label="Документи">
          <Link to="/oferta">Публічна оферта</Link>
          <Link to="/oferta#privacy">Конфіденційність</Link>
          <Link to="/oferta#return">Обмін і повернення</Link>
        </nav>
        <span>© {new Date().getFullYear()} Усі права захищено</span>
        <Link className="admin-link" to="/admin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Адмін
        </Link>
      </div>
    </footer>
  );
}

function Shell() {
  const { cartOpen, checkoutOpen } = useShop();

  // поки відкрито кошик або оформлення, сторінка під ними не прокручується
  useEffect(() => {
    document.body.style.overflow = cartOpen || checkoutOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen, checkoutOpen]);

  return (
    <div className="shop">
      <div className="notice">Зараз у наявності троянди та лаванда. Плодові й ягідні — передзамовлення на весну.</div>
      <Header />
      <main id="top"><Outlet /></main>
      <Footer />
      <div className="callbar">
        <a className="btn btn-gold" href={TEL_LINK}>Зателефонувати</a>
        <a className="btn btn-ghost" style={{ color: "#f3ecd6" }} href={VIBER_LINK} target="_blank" rel="noopener">Viber</a>
      </div>
      {cartOpen && <CartDrawer />}
      {checkoutOpen && <Checkout />}
      <ScrollRestoration />
    </div>
  );
}

export default function ShopLayout() {
  return (
    <ShopProvider>
      <Shell />
    </ShopProvider>
  );
}
