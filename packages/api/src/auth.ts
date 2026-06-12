import type { AuthSession, AuthUser } from "./types";

const USER_KEY = "auth_user";
const TOKEN_KEY = "access_token";

type Listener = (session: AuthSession | null) => void;

const listeners = new Set<Listener>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getSession(): AuthSession | null {
  const user = getUser();
  const accessToken = getToken();
  if (!user || !accessToken) return null;
  return { user, accessToken };
}

export function setSession(session: AuthSession): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
  window.sessionStorage.setItem(TOKEN_KEY, session.accessToken);
  notify();
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  const session = getSession();
  listeners.forEach((l) => l(session));
}

export function hasPermission(user: AuthUser | null, code: string): boolean {
  if (!user) return false;
  return user.permissions.some((p) => p.code === code);
}
