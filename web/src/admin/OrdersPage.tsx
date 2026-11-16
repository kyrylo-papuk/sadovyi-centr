import { useState } from "react";
import { Link } from "react-router-dom";
import { money, when } from "../lib/format";
import type { OrderStatus } from "../types";
import { STATUS, STATUSES, STATUS_FILTER, useAdmin } from "./AdminContext";

// Список замовлень із фільтром за статусом
export default function OrdersPage() {
  const { orders, refreshOrders, toast } = useAdmin();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const counts: Partial<Record<OrderStatus, number>> = {};
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1;
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div className="view-head">
        <h1>Замовлення</h1>
        <button className="btn btn-ghost btn-sm" type="button" onClick={async () => { await refreshOrders(); toast("Оновлено"); }}>Оновити</button>
      </div>
      <div className="chips" role="group" aria-label="Фільтр за статусом">
        <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Усі<span>{orders.length}</span></button>
        {STATUSES.map((k) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {STATUS_FILTER[k]}<span>{counts[k] || 0}</span>
          </button>
        ))}
      </div>
      <div className="list">
        {list.map((o) => (
          <Link key={o.id} className={"row" + (o.status === "new" ? " is-new" : "")} to={"/admin/orders/" + o.id} style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <b>{o.name}</b>
              <div className="sub">{o.phone}{o.city ? " · " + o.city : ""} · {o.count} шт</div>
            </div>
            <div className="right">
              <span className={"pill st-" + o.status}>{STATUS[o.status]}</span>
              <span className="sum">{money(o.total)}</span>
              <span className="sub">{when(o.created_at)}</span>
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="empty">
            {orders.length ? "Немає замовлень із таким статусом." : "Замовлень поки немає. Щойно хтось оформить замовлення на сайті, воно з'явиться тут."}
          </div>
        )}
      </div>
    </>
  );
}
