# Сайт «Сімейний садовий центр» (React)

Магазин и кабинет владелицы. React 19 + React Router 7, сборка Vite, тесты Vitest + Testing Library.

## Команды

```bash
npm install
npm run dev      # локальный сервер разработки, http://localhost:5173
npm test         # тесты
npm run build    # сборка в dist/
```

По умолчанию сайт работает с боевым API. Чтобы работать с локальным (см. `../order-bot`), скопируйте `.env.example` в `.env.local` и раскомментируйте `VITE_API_URL`.

## Выкладка

```bash
npm test && npm run build
cd ../order-bot && npx wrangler deploy -c site.wrangler.toml
```

## Структура

```
src/
  main.jsx, router.jsx   вход и список страниц
  config.js              телефон, Instagram, мин. сумма, аванс, категории, адрес API
  lib/                   api.js (запросы), format.js (цены, телефон, даты, фото)
  shop/                  магазин: главная, каталог, страница растения, корзина, оформление
  admin/                 кабинет: вход, заказы, растения, редактор
  pages/OfertaPage.jsx   публичная оферта
  styles/                base.css (цвета), shop.css, admin.css, oferta.css
  test/                  настройка тестов и подмена API
public/img/              фото сайта
```

## Адреса

| Адрес | Что |
|---|---|
| `/` | магазин |
| `/product/:id` | страница растения |
| `/oferta` | публичная оферта |
| `/admin` | кабинет: заказы |
| `/admin/orders/:id` | карточка заказа |
| `/admin/products`, `/admin/products/new`, `/admin/products/:id` | растения и редактор |
