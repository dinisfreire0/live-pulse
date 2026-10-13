/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional public origin used in share links / QR codes, e.g. http://192.168.1.20:5173 */
  readonly VITE_PUBLIC_BASE_URL?: string;
}
