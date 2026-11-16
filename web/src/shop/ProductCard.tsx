import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catName, imgUrl, money, salePct } from "../lib/format";
import type { Product } from "../types";
import { useShop } from "./ShopContext";

export function StockLabel({ inStock }: { inStock: boolean }) {
  return (
    <span className={"stock " + (inStock ? "in" : "pre")}>
      {inStock ? "Є в наявності" : "Передзамовлення на весну"}
    </span>
  );
}

// Картка рослини в каталозі та в блоці «Схожі саджанці»
export default function ProductCard({ product: p }: { product: Product }) {
  const { addToCart } = useShop();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  const link = "/product/" + p.id;
  return (
    <article className="card">
      <div className="card-img">
        <Link to={link} tabIndex={-1} aria-hidden="true">
          <img src={imgUrl(p.images[0])} alt="" loading="lazy" width="600" height="600" />
        </Link>
        {p.old !== null && <span className="tag-sale">−{salePct(p.price, p.old)}%</span>}
      </div>
      <div className="card-body">
        <span className="card-cat">{catName(p.cat)}</span>
        <h3><Link to={link}>{p.name}</Link></h3>
        <p className="card-note">{p.note}</p>
        <StockLabel inStock={p.stock} />
        <div className="card-foot">
          <div className={"price" + (p.old !== null ? " is-sale" : "")}>
            {p.old !== null && <s>{money(p.old)}</s>}
            {money(p.price)}
          </div>
          <button
            className={"btn btn-main add" + (added ? " added" : "")}
            onClick={() => { addToCart(p.id); setAdded(true); }}
          >
            {added ? "Додано ✓" : "У кошик"}
          </button>
        </div>
      </div>
    </article>
  );
}
