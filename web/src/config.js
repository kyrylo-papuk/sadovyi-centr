// Налаштування сайту: контакти, умови замовлення, категорії.

// Адреса API (Cloudflare Worker). Для локальної розробки задається у .env.local через VITE_API_URL.
export const API_URL = (
  import.meta.env.VITE_API_URL || "https://sadovyi-centr-api.sadovyi-centr-api.workers.dev"
).replace(/\/+$/, "");

export const SITE_NAME = "Сімейний садовий центр";

export const CONFIG = {
  phone: "+38 (068) 983 40 28", // як показувати номер
  phoneRaw: "+380689834028", // номер для дзвінка та Viber
  instagram: "family_garden_center", // нік в Instagram без @
  minOrder: 300,
  prepay: 100,
  hours: "щодня з 9:00 до 20:00",
};

export const TEL_LINK = "tel:" + CONFIG.phoneRaw;
export const VIBER_LINK = "viber://chat?number=" + encodeURIComponent(CONFIG.phoneRaw);
export const INSTAGRAM_LINK = "https://instagram.com/" + CONFIG.instagram;

// Категорії. img — фото плитки; also — які ще категорії показувати разом із цією.
// "all" і "sale" — службові (усі товари / товари зі старою ціною), рослину в них не додають.
export const CATEGORIES = [
  { id: "all", name: "Усі саджанці", img: "/img/seedlings.jpg" },
  { id: "roses", name: "Троянди", img: "/img/rose1.jpg" },
  { id: "fruit", name: "Плодові", img: "/img/apple.jpg" },
  { id: "berries", name: "Ягоди", img: "/img/blackberry.jpg", also: ["strawberry"] },
  { id: "strawberry", name: "Полуниця", img: "/img/strawberry.jpg" },
  { id: "grapes", name: "Виноград", img: "/img/grapes.jpg" },
  { id: "nuts", name: "Горіхи", img: "/img/walnut.jpg" },
  { id: "exotic", name: "Екзотичні", img: "/img/fig.jpg" },
  { id: "decor", name: "Декоративні", img: "/img/lavender.jpg" },
  { id: "sale", name: "Акційні" },
];

// Категорії, які можна призначити рослині в кабінеті
export const PLANT_CATEGORIES = CATEGORIES.filter((c) => c.id !== "all" && c.id !== "sale");
