import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // стилі написані з CSS-вкладеністю; розгортаємо її, щоб сайт працював і на старіших телефонах
    cssTarget: ["chrome100", "safari15", "firefox100"],
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
