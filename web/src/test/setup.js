import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom не вміє прокручувати сторінку
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
