import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catName, imgUrl, money } from "../lib/format.js";
import { useAdmin } from "./AdminContext.jsx";

// Список рослин із пошуком
export default function ProductsPage() {
  const { products, refreshProducts } = useAdmin();
  const [query, setQuery] = useState("");

  useEffect(() => { refreshProducts(); }, [refreshProducts]);

  const q = query.trim().toLowerCase();
  const list = products.filter((p) => !q || p.name.toLowerCase().includes(q) || catName(p.cat).toLowerCase().includes(q));

  return (
    <>
      <div className="view-head">
        <h1>Рослини</h1>
        <Link className="btn btn-gold" to="/admin/products/new">+ Додати рослину</Link>
      </div>
      <input className="inp" type="search" placeholder="Пошук за назвою або категорією" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 14 }} />
      <div className="list">
        {list.map((p) => (
          <Link key={p.id} className={"row prow" + (p.visible ? "" : " is-hidden")} to={"/admin/products/" + p.id} style={{ textDecoration: "none", color: "inherit" }}>
            {p.images[0] ? <img src={imgUrl(p.images[0])} alt="" loading="lazy" /> : <span className="noimg" />}
            <div>
              <b>{p.name}</b>
              <div className="sub">{catName(p.cat)}</div>
              <div className="pills">
                {!p.visible && <span className="pill">Прихована</span>}
                <span className={"pill " + (p.stock ? "st-done" : "st-shipped")}>{p.stock ? "В наявності" : "Передзамовлення"}</span>
                {p.old && <span className="pill warn">Акція</span>}
              </div>
            </div>
            <div className="right price">
              <span className="sum">{p.old && <s>{money(p.old)}</s>}{money(p.price)}</span>
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="empty">{products.length ? "Нічого не знайдено." : "Рослин ще немає. Натисніть «Додати рослину»."}</div>
        )}
      </div>
    </>
  );
}
