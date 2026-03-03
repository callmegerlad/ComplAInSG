export interface AuthUser {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  report_count?: number;
  alert_response_count?: number;
  trust_score?: number;
  badges?: string[];
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

interface StoredAuthSession {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

interface AuthPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends AuthPayload {
  display_name: string;
}

const AUTH_STORAGE_KEY = "complainsg.auth";
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const SINGPASS_START_URL = (import.meta.env.VITE_SINGPASS_START_URL ?? "").trim();
const SINGPASS_CALLBACK_URL = (import.meta.env.VITE_SINGPASS_CALLBACK_URL ?? "").trim();

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getSingpassStartUrl() {
  return SINGPASS_START_URL;
}

export function getSingpassCallbackUrl() {
  return SINGPASS_CALLBACK_URL;
}

export function loadStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed.accessToken || !parsed.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredAuthSession = {
    accessToken: session.access_token,
    tokenType: session.token_type,
    user: session.user,
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function loginWithPassword(payload: AuthPayload) {
  return request<AuthSession>("/users/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerWithPassword(payload: RegisterPayload) {
  return request<AuthSession>("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(accessToken: string) {
  return request<AuthUser>("/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getUserInitials(user: Pick<AuthUser, "display_name" | "email"> | null) {
  const source = user?.display_name?.trim() || user?.email?.trim() || "";
  if (!source) {
    return "CU";
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : "Request failed. Check that the backend is running and reachable.";
    throw new Error(detail);
  }

  return data as T;
}
