import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONFIG, SITE_NAME, TEL_LINK, VIBER_LINK } from "../config.js";
import { catName, imgUrl, money, salePct } from "../lib/format.js";
import { useShop } from "./ShopContext.jsx";
import ProductCard, { StockLabel } from "./ProductCard.jsx";

const PERKS = [
  "Викопуємо саджанець під ваше замовлення",
  "Відправка Новою Поштою по всій Україні",
  `Аванс ${CONFIG.prepay} грн, решта — при отриманні`,
  "Замінимо, якщо рослина прийде пошкодженою",
];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" strokeWidth="1.8" /><path d="m7.5 12.5 3 3 6-6.5" />
  </svg>
);

function Message({ title, children }) {
  return (
    <section className="pv">
      <div className="wrap">
        <div className="grid-msg">
          <p><b>{title}</b></p>
          {children}
          <Link className="btn btn-gold" to="/#catalog">До каталогу</Link>
        </div>
      </div>
    </section>
  );
}

function Product({ product: p }) {
  const { products, addToCart, setCategory, setCartOpen } = useShop();
  const [qty, setQty] = useState(1);
  const [addedQty, setAddedQty] = useState(0);
  const [photo, setPhoto] = useState(0);

  const photos = p.images.map(imgUrl);
  const others = products.filter((x) => x.id !== p.id);
  const related = [
    ...others.filter((x) => x.cat === p.cat),
    ...others.filter((x) => x.cat !== p.cat && x.stock === p.stock),
  ].slice(0, 4);
  const unit = /набір|розет/i.test(p.name) ? "набір" : "саджанець";
  const description = p.desc.length ? p.desc : [p.note];

  return (
    <section className="pv">
      <title>{`${p.name} — ${SITE_NAME}`}</title>
      <div className="wrap">
        <nav className="crumbs" aria-label="Ви тут">
          <Link to="/#top">Головна</Link><i>›</i>
          <Link to="/#catalog" onClick={() => setCategory("all")}>Каталог</Link><i>›</i>
          <Link to="/#catalog" onClick={() => setCategory(p.cat)}>{catName(p.cat)}</Link><i>›</i>
          <span>{p.name}</span>
        </nav>

        <div className="pv-top">
          <div className="pv-gallery">
            <div className="pv-main">
              {photos.length > 0 && <img src={photos[photo]} alt={p.name} width="600" height="600" />}
              {p.old && <span className="tag-sale">Акція −{salePct(p)}%</span>}
            </div>
            {photos.length > 1 && (
              <div className="pv-thumbs">
                {photos.map((src, i) => (
                  <button key={src} type="button" aria-current={i === photo} aria-label={"Фото " + (i + 1)} onClick={() => setPhoto(i)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pv-info">
            <p className="eyebrow">{catName(p.cat)}</p>
            <h1>{p.name}</h1>
            <p className="pv-lead">{p.note}</p>
            <div className={"pv-price" + (p.old ? " is-sale" : "")}>
              <b>{money(p.price)}</b>
              {p.old && <s>{money(p.old)}</s>}
              <small>Ціна за один {unit}</small>
            </div>
            <div className="pv-stock">
              <StockLabel inStock={p.stock} />
              <small>{p.stock ? "Відправимо протягом 1–3 робочих днів після оплати." : "Відправимо в сезон посадки — попередимо вас заздалегідь."}</small>
            </div>
            <div className="pv-buy">
              <div className="pv-qty">
                <button type="button" aria-label="Менше" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <output aria-live="polite">{qty}</output>
                <button type="button" aria-label="Більше" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
              </div>
              <button type="button" className="btn btn-gold" onClick={() => { addToCart(p.id, qty); setAddedQty(qty); }}>Додати в кошик</button>
            </div>
            {addedQty > 0 && (
              <div className="pv-added">
                <span>✓ Додано в кошик: {addedQty} шт</span>
                <button type="button" onClick={() => setCartOpen(true)}>Перейти до кошика</button>
              </div>
            )}
            <ul className="pv-perks">
              {PERKS.map((t) => <li key={t}><CheckIcon /><span>{t}</span></li>)}
            </ul>
            <p className="pv-ask">
              Сумніваєтесь, чи підійде рослина? <a href={TEL_LINK}>Зателефонуйте</a> або <a href={VIBER_LINK}>напишіть у Viber</a> — підкажемо.
            </p>
          </div>
        </div>

        <div className="pv-details">
          <div className="pv-desc">
            <h2>Опис</h2>
            {description.map((t, i) => <p key={i}>{t}</p>)}
          </div>
          {p.specs.length > 0 && (
            <div>
              <h2>Характеристики</h2>
              <dl className="pv-specs">
                {p.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="pv-related">
            <h2>Схожі саджанці</h2>
            <div className="grid">{related.map((x) => <ProductCard key={x.id} product={x} />)}</div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { products, status } = useShop();

  if (status === "loading") return <section className="pv"><div className="wrap"><p className="small">Завантажуємо…</p></div></section>;
  if (status === "error") {
    return <Message title="Не вдалося завантажити каталог"><p>Оновіть сторінку або зателефонуйте нам: {CONFIG.phone}.</p></Message>;
  }
  const product = products.find((p) => p.id === Number(id));
  if (!product) return <Message title="Такої рослини немає"><p>Можливо, вона закінчилась. Подивіться інші саджанці в каталозі.</p></Message>;

  // key — щоб кількість і вибране фото скидались при переході на іншу рослину
  return <Product key={product.id} product={product} />;
}
