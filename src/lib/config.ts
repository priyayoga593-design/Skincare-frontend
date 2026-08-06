const isBrowser = typeof window !== "undefined";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? `${window.location.protocol}//${window.location.host}/api`
    : "https://skincare-backend-9xia.onrender.com/api");
