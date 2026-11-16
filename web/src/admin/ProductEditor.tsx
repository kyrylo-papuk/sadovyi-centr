import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PLANT_CATEGORIES } from "../config";
import { imgUrl } from "../lib/format";
import type { AdminProduct, ImageResponse, ProductInput, Spec } from "../types";
import { errText, useAdmin } from "./AdminContext";
import Panel from "./Panel";
import { shrinkImage } from "./shrinkImage";

const MAX_PHOTOS = 10;

/** Поля форми: ціни й опис — рядками, як їх вводить людина */
interface ProductForm {
  name: string;
  cat: string;
  note: string;
  price: string;
  old: string;
  stock: boolean;
  visible: boolean;
  images: string[];
  desc: string;
  specs: Spec[];
}

const EMPTY: ProductForm = {
  name: "", cat: PLANT_CATEGORIES[0].id, note: "", price: "", old: "", stock: true, visible: true, images: [], desc: "", specs: [],
};

// рослина з API → поля форми
const toForm = (p: AdminProduct): ProductForm => ({
  name: p.name, cat: p.cat, note: p.note, price: String(p.price), old: p.old ? String(p.old) : "",
  stock: p.stock, visible: p.visible, images: p.images, desc: p.desc.join("\n"), specs: p.specs,
});

interface PhotosProps {
  images: string[];
  uploading: number;
  onChange: (images: string[]) => void;
  onAdd: (files: File[]) => void;
}

function Photos({ images, uploading, onChange, onAdd }: PhotosProps) {
  const move = (from: number, to: number) => {
    const next = [...images];
    next.splice(to, 0, ...next.splice(from, 1));
    onChange(next);
  };
  return (
    <div className="photos">
      {images.map((src, i) => (
        <div className="ph" key={src}>
          <img src={imgUrl(src)} alt="" />
          {i === 0 && <span className="main-tag">Головне</span>}
          <div className="ph-ctl">
            {i > 0 ? <button type="button" aria-label="Посунути ліворуч" onClick={() => move(i, i - 1)}>←</button> : <span />}
            {i > 0 && <button type="button" aria-label="Зробити головним" onClick={() => move(i, 0)}>★</button>}
            <button type="button" aria-label="Видалити фото" onClick={() => onChange(images.filter((_, j) => j !== i))}>✕</button>
          </div>
        </div>
      ))}
      {Array.from({ length: uploading }, (_, i) => <div className="ph loading" key={i}>Завантаження…</div>)}
      {images.length + uploading < MAX_PHOTOS && (
        <label className="add-photo">
          <input type="file" accept="image/*" multiple aria-label="Додати фото" onChange={(e) => { onAdd([...(e.target.files ?? [])]); e.target.value = ""; }} />
          <span><b>+</b><br />Додати фото</span>
        </label>
      )}
    </div>
  );
}

function Specs({ specs, onChange }: { specs: Spec[]; onChange: (specs: Spec[]) => void }) {
  const set = (i: number, col: 0 | 1, value: string) =>
    onChange(specs.map((row, j): Spec => (j !== i ? row : col === 0 ? [value, row[1]] : [row[0], value])));
  return (
    <>
      <div className="specs">
        {specs.map(([k, v], i) => (
          <div className="spec" key={i}>
            <input className="inp" value={k} placeholder="Напр.: Висота" aria-label="Назва характеристики" onChange={(e) => set(i, 0, e.target.value)} />
            <input className="inp" value={v} placeholder="Напр.: 1–1,2 м" aria-label="Значення" onChange={(e) => set(i, 1, e.target.value)} />
            <button type="button" aria-label="Прибрати рядок" onClick={() => onChange(specs.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {specs.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Немає характеристик.</p>}
      </div>
      <button className="btn btn-ghost btn-sm" type="button" style={{ justifySelf: "start" }} onClick={() => onChange([...specs, ["", ""]])}>
        + Додати характеристику
      </button>
    </>
  );
}

// Додавання та редагування рослини
export default function ProductEditor() {
  const { id } = useParams(); // немає id — нова рослина
  const navigate = useNavigate();
  const { call, toast, products, refreshProducts } = useAdmin();
  const [form, setForm] = useState<ProductForm | null>(id ? null : EMPTY);
  const [notFound, setNotFound] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);

  // відкриваємо рослину зі списку, а якщо сторінку відкрили напряму — спершу завантажуємо список
  useEffect(() => {
    if (!id) return;
    let alive = true;
    const find = (list: AdminProduct[]) => list.find((p) => p.id === Number(id));
    const open = (p: AdminProduct | undefined) => (p ? setForm(toForm(p)) : setNotFound(true));
    const known = find(products);
    if (known) open(known);
    else refreshProducts().then((list) => { if (alive && list) open(find(list)); });
    return () => { alive = false; };
    // рослину завантажуємо один раз на відкриття — подальші оновлення списку не мають затирати правки
  }, [id]);

  const toList = () => navigate("/admin/products");

  if (!form) {
    return (
      <Panel title="Рослина" onBack={toList}>
        {notFound ? <div className="empty">Рослину не знайдено.</div> : <p className="muted">Завантажуємо…</p>}
      </Panel>
    );
  }

  const change = (patch: Partial<ProductForm>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setDirty(true);
  };
  const back = () => {
    if (dirty && !window.confirm("Зміни не збережено. Вийти без збереження?")) return;
    toList();
  };

  const addPhotos = async (files: File[]) => {
    const list = files.slice(0, MAX_PHOTOS - form.images.length);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const blob = await shrinkImage(file);
        const d = await call<ImageResponse>("/admin/images", { method: "POST", body: blob, headers: { "Content-Type": "image/jpeg" } });
        setForm((f) => (f ? { ...f, images: [...f.images, d.src] } : f));
        setDirty(true);
      } catch (e) {
        toast(`Фото «${file.name}»: ${errText(e)}`, true);
      }
      setUploading((n) => n - 1);
    }
  };

  const save = async () => {
    const price = form.price === "" ? null : Number(form.price);
    const old = form.old === "" ? null : Number(form.old);
    if (!form.name.trim()) return toast("Вкажіть назву", true);
    if (price === null || !(price >= 0)) return toast("Вкажіть ціну", true);
    if (old !== null && old <= price) return toast("Стара ціна має бути більшою за нову", true);
    if (uploading) return toast("Зачекайте, фото ще завантажується", true);
    if (!form.images.length && !window.confirm("У рослини немає фото. Зберегти без фото?")) return;

    const data: ProductInput = {
      name: form.name.trim(), cat: form.cat, note: form.note.trim(), price, old,
      stock: form.stock, visible: form.visible, images: form.images,
      desc: form.desc.split("\n").map((s) => s.trim()).filter(Boolean),
      specs: form.specs.map(([k, v]): Spec => [k.trim(), v.trim()]).filter(([k, v]) => k && v),
    };
    setSaving(true);
    try {
      await call(id ? "/admin/products/" + id : "/admin/products", { method: id ? "PUT" : "POST", json: data });
      toast(id ? "Зміни збережено" : "Рослину додано");
      toList();
    } catch (e) {
      toast(errText(e), true);
      setSaving(false);
    }
  };

  const remove = async () => {
    const question = `Видалити «${form.name}» з каталогу? Це не можна скасувати.\n\nЯкщо рослина тимчасово закінчилась — краще зніміть галочку «Показувати на сайті».`;
    if (!window.confirm(question)) return;
    setSaving(true);
    try {
      await call("/admin/products/" + id, { method: "DELETE" });
      toast("Рослину видалено");
      toList();
    } catch (e) {
      toast(errText(e), true);
      setSaving(false);
    }
  };

  const footer = (
    <>
      {id && <button className="btn btn-danger" type="button" disabled={saving} onClick={remove}>Видалити</button>}
      <button className="btn btn-gold" type="button" disabled={saving} onClick={save}>{saving ? "Зберігаємо…" : "Зберегти"}</button>
    </>
  );

  return (
    <Panel title={id ? "Редагування" : "Нова рослина"} onBack={back} footer={footer}>
      <section className="card">
        <h2>Фото</h2>
        <p className="muted" style={{ fontSize: 14 }}>Перше фото — головне, воно показується в каталозі. Решта — у галереї на сторінці рослини.</p>
        <Photos images={form.images} uploading={uploading} onChange={(images) => change({ images })} onAdd={addPhotos} />
      </section>

      <section className="card">
        <h2>Основне</h2>
        <label className="field">Назва *
          <input value={form.name} placeholder="Напр.: Троянда «Піано»" required onChange={(e) => change({ name: e.target.value })} />
        </label>
        <label className="field">Категорія *
          <select value={form.cat} onChange={(e) => change({ cat: e.target.value })}>
            {PLANT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">Короткий підпис <small>Показується на картці в каталозі, 1 рядок</small>
          <input value={form.note} placeholder="Напр.: Червона, піоновидна, для зрізу" maxLength={200} onChange={(e) => change({ note: e.target.value })} />
        </label>
      </section>

      <section className="card">
        <h2>Ціна й наявність</h2>
        <div className="two">
          <label className="field">Ціна, грн *
            <input type="number" inputMode="numeric" min="0" step="1" required value={form.price} onChange={(e) => change({ price: e.target.value })} />
          </label>
          <label className="field">Стара ціна, грн <small>Заповніть, щоб показати знижку</small>
            <input type="number" inputMode="numeric" min="0" step="1" value={form.old} onChange={(e) => change({ old: e.target.value })} />
          </label>
        </div>
        <div className="radios" role="radiogroup" aria-label="Наявність">
          <label><input type="radio" name="stock" checked={form.stock} onChange={() => change({ stock: true })} /> Є в наявності</label>
          <label><input type="radio" name="stock" checked={!form.stock} onChange={() => change({ stock: false })} /> Передзамовлення</label>
        </div>
        <label className="switch">
          <input type="checkbox" checked={form.visible} onChange={(e) => change({ visible: e.target.checked })} /> Показувати на сайті
        </label>
      </section>

      <section className="card">
        <h2>Опис</h2>
        <label className="field">Текст на сторінці рослини <small>Кожен абзац — з нового рядка</small>
          <textarea rows={5} value={form.desc} onChange={(e) => change({ desc: e.target.value })} />
        </label>
      </section>

      <section className="card">
        <h2>Характеристики</h2>
        <Specs specs={form.specs} onChange={(specs) => change({ specs })} />
      </section>
    </Panel>
  );
}
