import { Link } from "react-router-dom";
import { CONFIG, INSTAGRAM_LINK, SITE_NAME, TEL_LINK, VIBER_LINK } from "../config.js";
import { useShop } from "./ShopContext.jsx";
import Catalog from "./Catalog.jsx";

const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };

const FAQ = [
  ["Саджанець приживеться, якщо я новачок?", "Так. До кожної посилки кладемо коротку пам’ятку з посадки. А якщо щось незрозуміло — просто зателефонуйте, ми підкажемо."],
  ["Що робити, якщо рослина приїхала пошкодженою?", "Сфотографуйте її на пошті при отриманні та напишіть нам у Viber. Ми замінимо саджанець або повернемо гроші."],
  ["Чи можна приїхати й забрати самостійно?", "Так, за попереднім дзвінком. Адресу розсадника повідомимо по телефону."],
  ["Коли краще садити плодові дерева?", "Навесні, до розпускання бруньок, або восени після листопаду — за 3–4 тижні до морозів."],
  ["Чи є знижки на великі замовлення?", "Так. Від 2000 грн — знижка 5%, від 5000 грн — 10%. Для фермерів та озеленювачів домовляємось окремо."],
];

function Hero() {
  const { products, status } = useShop();
  return (
    <section className="hero">
      <div className="wrap">
        <div>
          <p className="eyebrow" style={{ color: "var(--gold)" }}>Саджанці з родинного розсадника</p>
          <h1 style={{ marginTop: 12 }}>Саджанці для вашого саду — <em>з турботою від нашої родини</em></h1>
          <p className="lead">Троянди, плодові дерева, ягідні кущі та декоративні рослини. Кожен саджанець викопуємо під ваше замовлення й надсилаємо Новою Поштою по всій Україні.</p>
          <div className="actions">
            <Link className="btn btn-ghost" to="/#how">Як замовити</Link>
          </div>
        </div>
        <div className="hero-photo">
          <img src="/img/hero.jpg" alt="Ряди саджанців у горщиках у теплиці" width="1200" height="900" />
          {status === "ready" && (
            <div className="hero-badge"><b>{products.length}</b><span>сортів у каталозі — троянди, дерева, ягоди, виноград</span></div>
          )}
        </div>
      </div>
      <div className="hero-arc" aria-hidden="true" />
    </section>
  );
}

function Terms() {
  return (
    <section className="terms" aria-label="Умови замовлення">
      <div className="wrap">
        <div className="terms-grid">
          <div className="term">
            <svg {...icon}><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2" /><path d="M4 12h16" /></svg>
            <b>від {CONFIG.minOrder} грн</b><span>мінімальна сума замовлення</span>
          </div>
          <div className="term">
            <svg {...icon}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>
            <b>Нова Пошта</b><span>відправка по всій Україні за 1–3 дні</span>
          </div>
          <div className="term">
            <svg {...icon}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></svg>
            <b>{CONFIG.prepay} грн</b><span>аванс, решта — при отриманні</span>
          </div>
          <div className="term">
            <svg {...icon}><path d="M12 21c-4-3-7-6.5-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5c0 4-3 7.5-7 10.5z" /><path d="M12 7v7M9 11l3 3 3-3" /></svg>
            <b>Порада садівника</b><span>підкажемо, що і де посадити</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="steps" id="how">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Як замовити</p>
          <h2>Три простих кроки</h2>
        </div>
        <div className="steps-grid">
          <div className="step"><div className="step-num">1</div><h3>Оберіть рослини</h3><p>Натисніть «У кошик» біля потрібних саджанців. Кількість можна змінити в кошику.</p></div>
          <div className="step"><div className="step-num">2</div><h3>Залиште контакти</h3><p>Вкажіть ім’я, телефон, місто та відділення Нової Пошти. Ми передзвонимо й уточнимо деталі.</p></div>
          <div className="step"><div className="step-num">3</div><h3>Підтвердимо й відправимо</h3><p>Ми зателефонуємо, підтвердимо замовлення й повідомимо реквізити. Достатньо внести аванс {CONFIG.prepay} грн, а решту сплатити на пошті.</p></div>
        </div>
      </div>
    </section>
  );
}

function Delivery() {
  return (
    <section id="delivery">
      <div className="wrap two">
        <div>
          <div className="section-head">
            <p className="eyebrow">Доставка й оплата</p>
            <h2>Надсилаємо так, щоб коріння доїхало живим</h2>
          </div>
          <dl className="facts">
            <div className="fact"><dt>Як пакуємо</dt><dd>Коріння у вологому субстраті та плівці, гілки захищені. Кожен сорт підписаний.</dd></div>
            <div className="fact"><dt>Коли відправляємо</dt><dd>Троянди й лаванду — одразу. Плодові та ягідні — у сезон посадки: весна (березень–квітень) та осінь (жовтень–листопад).</dd></div>
            <div className="fact"><dt>Вартість доставки</dt><dd>За тарифами Нової Пошти, зазвичай 80–150 грн за посилку.</dd></div>
            <div className="fact"><dt>Оплата</dt><dd>Після замовлення ми зателефонуємо й повідомимо реквізити. Можна сплатити всю суму одразу або аванс {CONFIG.prepay} грн, а решту — накладеним платежем при отриманні.</dd></div>
          </dl>
        </div>
        <div className="photo-frame"><img src="/img/seedlings.jpg" alt="Молоді саджанці на стелажах у теплиці" width="900" height="700" loading="lazy" /></div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Часті питання</p>
          <h2>Відповідаємо на те, що питають найчастіше</h2>
        </div>
        <div className="faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="about">
      <div className="wrap">
        <img src="/img/logo-wide.jpg" alt={`Логотип «${SITE_NAME}»`} width="624" height="520" loading="lazy" />
        <div>
          <p className="eyebrow" style={{ color: "var(--gold)" }}>Про нас</p>
          <h2 style={{ marginTop: 10 }}>Дякуємо за довіру!</h2>
          <p>Ми — родинний розсадник. Самі вирощуємо, доглядаємо і перевіряємо кожен саджанець, перш ніж надіслати його вам.</p>
          <p>Хочемо, щоб ваш сад цвів і плодоносив багато років — тому продаємо лише ті сорти, які добре ростуть у нашому кліматі.</p>
          <p className="sign">Ваш «{SITE_NAME}»</p>
        </div>
      </div>
    </section>
  );
}

function Contacts() {
  return (
    <section id="contacts">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Контакти</p>
          <h2>Зв’яжіться з нами зручним способом</h2>
          <p>Приймаємо замовлення {CONFIG.hours}.</p>
        </div>
        <div className="contacts-grid">
          <a className="contact" href={TEL_LINK}><span>Телефон</span><b>{CONFIG.phone}</b></a>
          <a className="contact" href={VIBER_LINK} target="_blank" rel="noopener"><span>Viber</span><b>{CONFIG.phone}</b></a>
          <a className="contact" href={INSTAGRAM_LINK} target="_blank" rel="noopener"><span>Instagram</span><b>@{CONFIG.instagram}</b></a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <title>{SITE_NAME}</title>
      <Hero />
      <Catalog />
      <Terms />
      <Steps />
      <Delivery />
      <Faq />
      <About />
      <Contacts />
    </>
  );
}
