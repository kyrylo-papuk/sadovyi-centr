import { useEffect, useRef, useState } from "react";
import { CONFIG, SITE_NAME, TEL_LINK, VIBER_LINK } from "../config.js";
import { api } from "../lib/api.js";
import { money, normalizePhone } from "../lib/format.js";
import { useShop } from "./ShopContext.jsx";

// спосіб доставки → підказка для поля адреси
const PLACES = {
  "У відділення": "Номер відділення Нової Пошти",
  "У поштомат": "Номер поштомату Нової Пошти",
  "Кур'єром на адресу": "Вулиця, будинок, квартира",
};

function orderText(o) {
  return (
    `Замовлення з сайту «${SITE_NAME}»\n\n` +
    o.items.map((i) => `• ${i.name} — ${i.qty} шт × ${i.price} = ${money(i.price * i.qty)}`).join("\n") +
    `\n\nРазом: ${money(o.total)}\n\nІм'я: ${o.name}\nТелефон: ${o.phone}\nE-mail: ${o.email}` +
    `\nДоставка: ${o.delivery.type}, ${o.delivery.city}, ${o.delivery.np}` +
    (o.note ? `\nНотатки: ${o.note}` : "")
  );
}

function CallCard({ title }) {
  return (
    <div className="call-card">
      <span>{title}</span>
      <b>{CONFIG.phone}</b>
      <div className="row">
        <a className="btn btn-gold" href={TEL_LINK}>Зателефонувати</a>
        <a className="btn btn-ghost" href={VIBER_LINK}>Viber</a>
      </div>
      <small>Приймаємо дзвінки {CONFIG.hours}</small>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Скопіюйте текст замовлення:", text);
    }
  };
  return (
    <button type="button" className={"btn btn-ghost" + (copied ? " ok" : "")} onClick={copy}>
      {copied ? "Скопійовано" : "Скопіювати текст замовлення"}
    </button>
  );
}

function OrderForm({ onSubmit, sending }) {
  const { items, total } = useShop();
  const [place, setPlace] = useState(Object.keys(PLACES)[0]);
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  const submit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const phoneInput = form.elements.phone;
    const phone = normalizePhone(phoneInput.value);
    if (!phone) {
      phoneInput.setCustomValidity("Вкажіть номер у форматі 067 123 45 67 або +380 67 123 45 67");
      phoneInput.reportValidity();
      return;
    }
    const data = new FormData(form);
    const get = (k) => String(data.get(k) || "").trim();
    onSubmit({
      first: get("first"),
      name: `${get("first")} ${get("last")}`.trim(),
      phone,
      email: get("email"),
      delivery: { type: get("type"), city: get("city"), np: get("np") },
      note: get("note"),
      items: items.map(({ product: p, qty }) => ({ id: p.id, name: p.name, qty, price: p.price })),
      total,
      website: get("website"), // пастка для ботів: люди це поле не бачать
    });
  };

  return (
    <form className="co-grid" onSubmit={submit}>
      <div className="co-fields">
        <h2>Оплата та доставка</h2>
        <div className="co-two">
          <label>Ім'я <i>*</i><input ref={firstRef} name="first" required autoComplete="given-name" /></label>
          <label>Прізвище <i>*</i><input name="last" required autoComplete="family-name" /></label>
        </div>
        <label>Телефон <i>*</i>
          <input name="phone" type="tel" inputMode="tel" required autoComplete="tel" onInput={(e) => e.currentTarget.setCustomValidity("")} />
        </label>
        <label>E-mail адреса <i>*</i><input name="email" type="email" required autoComplete="email" /></label>

        <h2>Вкажіть адресу доставки</h2>
        <select name="type" aria-label="Спосіб доставки" value={place} onChange={(e) => setPlace(e.target.value)}>
          {Object.keys(PLACES).map((k) => <option key={k}>{k}</option>)}
        </select>
        <input name="city" required placeholder="Населений пункт" aria-label="Населений пункт" autoComplete="address-level2" />
        <input name="np" required placeholder={PLACES[place]} aria-label={PLACES[place]} />

        <h2>Додаткова інформація</h2>
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <label>Нотатки до замовлення (необов'язково)
          <textarea name="note" rows="4" placeholder="Нотатки до вашого замовлення, наприклад спеціальні нотатки для доставки." />
        </label>
      </div>

      <aside className="co-summary">
        <h2>Ваше замовлення</h2>
        <div className="sum-row sum-head"><span>Товар</span><span>Проміжний підсумок</span></div>
        {items.map(({ product: p, qty }) => (
          <div className="sum-row" key={p.id}><span>{p.name} <b>× {qty}</b></span><span className="num">{money(p.price * qty)}</span></div>
        ))}
        <div className="sum-row"><b>Проміжний підсумок</b><b className="num">{money(total)}</b></div>
        <div className="sum-row sum-col"><b>Відправлення</b><span>Нова Пошта — за тарифами перевізника</span></div>
        <div className="sum-row sum-total"><b>Загалом</b><b className="num">{money(total)}</b></div>

        <div className="pay-box">
          <div className="pay-line" style={{ cursor: "default" }}>Оплата після підтвердження</div>
          <p>Після замовлення ми зателефонуємо, підтвердимо наявність і повідомимо реквізити. Аванс — {money(CONFIG.prepay)}, решта — при отриманні на Новій Пошті.</p>
        </div>

        <p className="small">
          Ваші особисті дані використовуватимуться для обробки вашого замовлення та для інших цілей, описаних у нашій{" "}
          <a href="/oferta#privacy" target="_blank" rel="noopener">політиці конфіденційності</a>.
        </p>
        <button className="btn btn-gold co-submit" type="submit" disabled={sending}>
          {sending ? "Надсилаємо…" : "Надіслати замовлення"}
        </button>
      </aside>
    </form>
  );
}

function Sent({ order, onDone }) {
  return (
    <div className="done co-done">
      <div className="step-num">✓</div>
      <h2>Замовлення надіслано!</h2>
      <p className="co-lead">
        Дякуємо{order.first ? ", " + order.first : ""}! Замовлення <b>{order.num}</b> вже у нас. Ми зателефонуємо вам на{" "}
        <b>{order.phone}</b> найближчим часом, щоб підтвердити наявність, доставку й оплату.
      </p>
      <div className="sent-list">
        {order.items.map((i) => (
          <div className="sum-row" key={i.id}><span>{i.name} <b>× {i.qty}</b></span><span className="num">{money(i.price * i.qty)}</span></div>
        ))}
        <div className="sum-row sum-total"><b>Разом</b><b className="num">{money(order.total)}</b></div>
      </div>
      <CallCard title="Хочете швидше або маєте питання? Зателефонуйте:" />
      <button type="button" className="btn btn-main" onClick={onDone}>Повернутися на сайт</button>
    </div>
  );
}

function Failed({ order, onRetry, sending }) {
  return (
    <div className="done co-done">
      <div className="step-num is-warn">!</div>
      <h2>Не вдалося надіслати замовлення</h2>
      <p className="co-lead">Схоже, проблема зі зв'язком. Ваш кошик збережено — спробуйте ще раз або просто зателефонуйте нам, і ми оформимо замовлення по телефону.</p>
      <button type="button" className="btn btn-gold" onClick={onRetry} disabled={sending}>
        {sending ? "Надсилаємо…" : "Спробувати ще раз"}
      </button>
      <CallCard title="Оформимо замовлення по телефону:" />
      <CopyButton text={orderText(order)} />
    </div>
  );
}

// Оформлення замовлення: форма → «надіслано» або «не вдалося»
export default function Checkout() {
  const { clearCart, setCartOpen, setCheckoutOpen } = useShop();
  const [stage, setStage] = useState("form"); // form | sent | failed
  const [order, setOrder] = useState(null);
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);

  const send = async (data) => {
    setSending(true);
    setOrder(data);
    try {
      const res = await api("/order", { method: "POST", json: data });
      setOrder({ ...data, num: res.num, total: res.total ?? data.total });
      clearCart();
      setStage("sent");
    } catch (e) {
      console.warn("Замовлення не надіслано:", e);
      setStage("failed");
    } finally {
      setSending(false);
      boxRef.current?.scrollTo?.(0, 0);
    }
  };

  const close = () => setCheckoutOpen(false);
  // «Назад»: з форми повертаємось у кошик, після надсилання — просто на сайт
  const back = () => {
    close();
    if (stage !== "sent") setCartOpen(true);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") back(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="checkout" ref={boxRef} role="dialog" aria-modal="true" aria-label="Оформлення замовлення">
      <div className="co-bar">
        <div className="wrap co-bar-row">
          <button type="button" className="co-back" onClick={back}>← Назад</button>
          <b>Оформлення замовлення</b>
        </div>
      </div>
      <div className="wrap co-body">
        {stage === "form" && <OrderForm onSubmit={send} sending={sending} />}
        {stage === "sent" && <Sent order={order} onDone={close} />}
        {stage === "failed" && <Failed order={order} onRetry={() => send(order)} sending={sending} />}
      </div>
    </div>
  );
}
