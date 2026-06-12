import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearSession, getToken } from "./auth";

export const API_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000/api";

type LoadingListener = (active: boolean) => void;
const loadingListeners = new Set<LoadingListener>();
let pending = 0;

export function onLoadingChange(listener: LoadingListener): () => void {
  loadingListeners.add(listener);
  return () => loadingListeners.delete(listener);
}

function setLoading(delta: number): void {
  pending = Math.max(0, pending + delta);
  const active = pending > 0;
  loadingListeners.forEach((l) => l(active));
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  if (config.headers.get("X-Silent") !== "true") {
    setLoading(1);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.headers?.get("X-Silent") !== "true") {
      setLoading(-1);
    }
    return response;
  },
  (error) => {
    if (error.config?.headers?.get?.("X-Silent") !== "true") {
      setLoading(-1);
    }
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Normalizes list responses into a plain array. The backend returns bare JSON
// arrays for collection endpoints, but some clients also expect OData-style
// envelopes ({ value, Count }) or paged envelopes ({ items } / { data }).
// This accepts all of them and always yields an array.
export function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const env = res as { value?: unknown; items?: unknown; data?: unknown };
    if (Array.isArray(env.value)) return env.value as T[];
    if (Array.isArray(env.items)) return env.items as T[];
    if (Array.isArray(env.data)) return env.data as T[];
  }
  return [];
}

// Thin typed helpers.
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function post<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function put<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.put<T>(url, body, config);
  return data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}
