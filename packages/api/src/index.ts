import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

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
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
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
