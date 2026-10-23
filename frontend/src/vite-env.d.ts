/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clave de API de Google Gemini (https://aistudio.google.com/apikey). Vacía = usar Ollama local. */
  readonly VITE_GEMINI_API_KEY?: string;
  /** Modelo Gemini opcional (defecto: gemini-2.5-flash). */
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}