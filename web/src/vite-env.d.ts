/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Адреса API. Якщо не задано — бойовий сервер. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
