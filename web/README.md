# Сайт «Сімейний садовий центр» (React)

Магазин и кабинет владелицы. React 19 + TypeScript (строгий режим), React Router 7, сборка Vite, тесты Vitest + Testing Library.

## Команды

```bash
npm install
npm run dev      # локальный сервер разработки, http://localhost:5173
npm run typecheck  # проверка типов
npm test         # тесты
npm run build    # проверка типов + сборка в dist/
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
  main.tsx, router.tsx   вход и список страниц
  config.ts              телефон, Instagram, мин. сумма, аванс, категории, адрес API
  types.ts               типы данных: растение, заказ, ответы API
  lib/                   api.ts (запросы), format.ts (цены, телефон, даты, фото)
  shop/                  магазин: главная, каталог, страница растения, корзина, оформление
  admin/                 кабинет: вход, заказы, растения, редактор
  pages/OfertaPage.tsx   публичная оферта
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
