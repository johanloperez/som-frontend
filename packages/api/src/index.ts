import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://wholesale-platform-api-bkdxfzcjhwb8bef3.spaincentral-01.azurewebsites.net/api/v1";

let loadingCount = 0;
const listeners = new Set<(loading: boolean) => void>();

export function onLoadingChange(listener: (loading: boolean) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify() {
  const loading = loadingCount > 0;
  listeners.forEach((l) => l(loading));
}

export function createClient(config?: AxiosRequestConfig): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
    ...config,
  });

  client.interceptors.request.use((req) => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("access_token");
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
    loadingCount++;
    notify();
    return req;
  });

  client.interceptors.response.use(
    (res) => {
      loadingCount--;
      notify();
      return res;
    },
    (err) => {
      loadingCount--;
      notify();
      if (err.response?.status === 401) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("auth_user");
          sessionStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const api = createClient();
