const apiBaseFromEnv = import.meta.env.VITE_API_BASE;
const backendUrlFromEnv = import.meta.env.VITE_BACKEND_URL;
const apiBaseFromWindow =
  typeof window !== "undefined" ? window.API_BASE : undefined;
const backendUrlFromWindow =
  typeof window !== "undefined" ? window.BACKEND_URL : undefined;

export const API_BASE =
  apiBaseFromEnv || apiBaseFromWindow || "http://localhost:5000/api";

export const BACKEND_URL =
  backendUrlFromEnv || backendUrlFromWindow || "http://localhost:5000";

if (typeof window !== "undefined") {
  window.API_BASE = API_BASE;
  window.BACKEND_URL = BACKEND_URL;
}
