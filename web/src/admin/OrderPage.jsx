import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { imgUrl, money, when } from "../lib/format.js";
import { STATUS, errText, useAdmin } from "./AdminContext.jsx";
import Panel from "./Panel.jsx";

// Картка замовлення: клієнт, доставка, товари з фото, статус, нотатка
export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { call, toast, refreshOrders, products, refreshProducts } = useAdmin();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    call("/admin/orders/" + id)
      .then((d) => {
        if (!alive) return;
        setOrder(d.order);
        setNote(d.order.admin_note || "");
        // у старих замовленнях фото не збережене — беремо з каталогу
        if (d.order.items.some((i) => !i.img)) refreshProducts();
      })
      .catch((e) => alive && setError(e.code === "not_found" ? "Замовлення не знайдено." : errText(e)));
    return () => { alive = false; };
  }, [id, call, refreshProducts]);

  const back = () => navigate("/admin");

  if (!order) {
    return (
      <Panel title="Замовлення" onBack={back}>
        {error ? <div className="empty">{error}</div> : <p className="muted">Завантажуємо…</p>}
      </Panel>
    );
  }

  const itemImg = (i) => i.img || (products.find((p) => p.id === i.id)?.images || [])[0] || "";
  const tel = order.phone.replace(/[^\d+]/g, "");

  const setStatus = async (status) => {
    try {
      const d = await call("/admin/orders/" + id, { method: "PATCH", json: { status } });
      setOrder(d.order);
      toast("Статус: " + STATUS[status]);
      refreshOrders(true);
    } catch (e) {
      toast(errText(e), true);
    }
  };
  const saveNote = async () => {
    try {
      await call("/admin/orders/" + id, { method: "PATCH", json: { admin_note: note } });
      toast("Нотатку збережено");
    } catch (e) {
      toast(errText(e), true);
    }
  };

  return (
    <Panel title={"Замовлення " + (order.num || "#" + order.id)} onBack={back}>
      <p className="muted">{when(order.created_at)}</p>

      <section className="card">
        <h2>Клієнт</h2>
        <div className="big">{order.name}</div>
        <div className="big" style={{ fontSize: 20 }}>{order.phone}</div>
        <div className="actions">
          <a className="btn btn-gold" href={"tel:" + tel}>Зателефонувати</a>
          <a className="btn btn-ghost" href={"viber://chat?number=" + encodeURIComponent(tel)}>Viber</a>
        </div>
        {order.email && <div>E-mail: <a href={"mailto:" + order.email}>{order.email}</a></div>}
      </section>

      <section className="card">
        <h2>Доставка</h2>
        <div><b>{order.delivery_type || "Нова Пошта"}</b></div>
        <div>{order.city}{order.np ? ", " + order.np : ""}</div>
      </section>

      {order.note && (
        <section className="card">
          <h2>Коментар клієнта</h2>
          <div style={{ whiteSpace: "pre-wrap" }}>{order.note}</div>
        </section>
      )}

      <section className="card items">
        <h2>Товари</h2>
        {order.items.map((i) => {
          const src = itemImg(i);
          return (
            <div className="it it-row" key={i.id}>
              {src ? <img className="it-img" src={imgUrl(src)} alt="" loading="lazy" /> : <span className="it-img" />}
              <span>{i.name} <b>× {i.qty}</b><br /><span className="muted" style={{ fontSize: 14 }}>{money(i.price)} за шт</span></span>
              <span className="num">{money(i.price * i.qty)}</span>
            </div>
          );
        })}
        <div className="it total"><span>Разом</span><span className="num">{money(order.total)}</span></div>
      </section>

      <section className="card">
        <h2>Статус</h2>
        <div className="statuses" role="group" aria-label="Статус замовлення">
          {Object.entries(STATUS).map(([k, label]) => (
            <button key={k} type="button" className={"st-" + k} aria-pressed={order.status === k} onClick={() => setStatus(k)}>{label}</button>
          ))}
        </div>
        <label className="field" style={{ marginTop: 6 }}>Нотатка для себе <small>Бачите лише ви</small>
          <textarea rows="3" placeholder="Напр.: передзвонила, аванс отримано, ТТН 2045…" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="btn btn-main" type="button" onClick={saveNote}>Зберегти нотатку</button>
      </section>
    </Panel>
  );
}
