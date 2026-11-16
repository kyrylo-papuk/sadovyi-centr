import { describe, expect, it } from "vitest";
import { API_URL } from "../config";
import { imgUrl, inCategory, money, normalizePhone, salePct } from "./format";

describe("inCategory", () => {
  const rose = { cat: "roses", old: null };
  const strawberry = { cat: "strawberry", old: 180 };

  it("«Усі» показує все", () => {
    expect(inCategory(rose, "all")).toBe(true);
  });
  it("«Акційні» — тільки товари зі старою ціною", () => {
    expect(inCategory(rose, "sale")).toBe(false);
    expect(inCategory(strawberry, "sale")).toBe(true);
  });
  it("полуниця показується і в «Ягодах»", () => {
    expect(inCategory(strawberry, "strawberry")).toBe(true);
    expect(inCategory(strawberry, "berries")).toBe(true);
    expect(inCategory(rose, "berries")).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("приймає український номер у різних записах", () => {
    expect(normalizePhone("067 123 45 67")).toBe("+380671234567");
    expect(normalizePhone("+38 (067) 123-45-67")).toBe("+380671234567");
    expect(normalizePhone("380671234567")).toBe("+380671234567");
  });
  it("відхиляє неповний або чужий номер", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("+1 202 555 0100")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});

describe("imgUrl", () => {
  it("фото сайту — абсолютний шлях, щоб працювало на будь-якій сторінці", () => {
    expect(imgUrl("img/rose1.jpg")).toBe("/img/rose1.jpg");
    expect(imgUrl("/img/rose1.jpg")).toBe("/img/rose1.jpg");
  });
  it("фото з кабінету береться з API", () => {
    const src = "/img/0123456789abcdef0123456789abcdef";
    expect(imgUrl(src)).toBe(API_URL + src);
  });
  it("порожнє значення не ламається", () => {
    expect(imgUrl("")).toBe("");
    expect(imgUrl(undefined)).toBe("");
  });
});

it("salePct рахує відсоток знижки", () => {
  expect(salePct(110, 125)).toBe(12);
});

it("money додає «грн»", () => {
  expect(money(90)).toBe("90 грн");
  expect(money(1500)).toMatch(/^1\s?500 грн$/);
});
