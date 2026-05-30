import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const TOKEN_STORAGE_KEY = "blog-platform-token";
const USER_STORAGE_KEY = "blog-platform-user";

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export function extractApiError(error, fallback = "Something went wrong.") {
  const payload = error?.response?.data;

  if (typeof payload === "string") return payload;
  if (payload?.error) return payload.error;
  if (payload?.message) return payload.message;
  if (payload && typeof payload === "object") {
    return Object.entries(payload)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  }

  return error?.message || fallback;
}
