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

// Structured, human-readable interpretation of a failed request. Lets the UI
// tell the user *why* something failed instead of showing one generic message.
export interface ParsedApiError {
  /** HTTP status returned by the server, or 0 when no response arrived. */
  status: number;
  /** Short headline, suitable for a toast title. */
  title: string;
  /** Explanation in plain language, suitable for a toast body. */
  detail: string;
}

// Pulls a message out of the common backend error shapes: a bare string,
// ASP.NET ProblemDetails ({ title, detail }), or { message } / { error }.
function extractServerMessage(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const key of ["message", "detail", "title", "error"]) {
      const v = d[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return undefined;
}

// Turns any thrown value from a request into something we can show the user.
// Crucially, it separates "the server rejected us" (has a status) from "we
// never reached the server" (network down, CORS, DNS, timeout, mixed content),
// which otherwise look identical to a credentials error.
export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error)) {
    // No response object → the request never completed a round trip.
    if (!error.response) {
      if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) {
        return {
          status: 0,
          title: "El servidor tardó demasiado",
          detail: "La conexión expiró. Revisa tu red e inténtalo de nuevo.",
        };
      }
      return {
        status: 0,
        title: "Sin conexión con el servidor",
        detail:
          "No se pudo contactar al servidor. Revisa tu conexión a internet e inténtalo de nuevo.",
      };
    }

    const status = error.response.status;
    const serverMessage = extractServerMessage(error.response.data);
    switch (status) {
      case 400:
        return {
          status,
          title: "Datos inválidos",
          detail: serverMessage ?? "Revisa la información ingresada.",
        };
      case 401:
        return {
          status,
          title: "Credenciales incorrectas",
          detail: "El correo o la contraseña no son válidos.",
        };
      case 403:
        return {
          status,
          title: "Acceso denegado",
          detail: serverMessage ?? "Tu cuenta no tiene permiso para acceder.",
        };
      case 404:
        return {
          status,
          title: "No encontrado",
          detail: serverMessage ?? "El recurso solicitado no existe.",
        };
      case 429:
        return {
          status,
          title: "Demasiados intentos",
          detail:
            "Has realizado demasiados intentos. Espera un momento e inténtalo de nuevo.",
        };
      default:
        if (status >= 500) {
          return {
            status,
            title: "Error del servidor",
            detail:
              serverMessage ??
              "Ocurrió un problema en el servidor. Inténtalo más tarde.",
          };
        }
        return {
          status,
          title: "No se pudo completar la solicitud",
          detail: serverMessage ?? `Error ${status}.`,
        };
    }
  }

  return {
    status: 0,
    title: "Error inesperado",
    detail: error instanceof Error ? error.message : "Ocurrió un error desconocido.",
  };
}

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

export async function patch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}
