import { CATEGORIES, CONFIG, TEL_LINK } from "../config.js";
import { inCategory } from "../lib/format.js";
import { useShop } from "./ShopContext.jsx";
import ProductCard from "./ProductCard.jsx";

function CategoryTiles() {
  const { category, setCategory } = useShop();
  return (
    <div className="cats" role="group" aria-label="Категорії саджанців">
      {CATEGORIES.map((c) => (
        <button key={c.id} type="button" className="cat" aria-pressed={c.id === category} onClick={() => setCategory(c.id)}>
          {c.img ? (
            <span className="cat-img"><img src={c.img} alt="" loading="lazy" width="600" height="600" /></span>
          ) : (
            <span className="cat-img cat-sale" aria-hidden="true"><b>−%</b><span>знижки</span></span>
          )}
          <span className="cat-name">{c.name}</span>
        </button>
      ))}
    </div>
  );
}

function ProductGrid() {
  const { products, status, category } = useShop();
  if (status === "loading") return <p className="small">Завантажуємо каталог…</p>;
  if (status === "error") {
    return (
      <div className="grid-msg">
        <p>Не вдалося завантажити каталог. Оновіть сторінку або зателефонуйте нам — підкажемо, що є в наявності.</p>
        <a className="btn btn-gold" href={TEL_LINK}>{CONFIG.phone}</a>
      </div>
    );
  }
  const list = products.filter((p) => inCategory(p, category));
  if (!list.length) return <p className="small">У цій категорії поки немає товарів.</p>;
  return list.map((p) => <ProductCard key={p.id} product={p} />);
}

export default function Catalog() {
  return (
    <section id="catalog">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Каталог</p>
          <h2>Оберіть саджанці</h2>
          <p>Натисніть на категорію, щоб побачити лише потрібні рослини. Ціна вказана за один саджанець, якщо не написано інше.</p>
        </div>
        <CategoryTiles />
        <div className="grid"><ProductGrid /></div>
      </div>
    </section>
  );
}
