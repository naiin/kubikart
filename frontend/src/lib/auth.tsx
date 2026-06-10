"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthSnapshot {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_STORAGE_KEY = "kubikart-user";
const TOKEN_STORAGE_KEY = "kubikart-token";
const AUTH_UPDATED_EVENT = "auth-updated";
const SERVER_AUTH_SNAPSHOT: AuthSnapshot = { user: null, loading: true };
const EMPTY_AUTH_SNAPSHOT: AuthSnapshot = { user: null, loading: false };

let cachedRawUser: string | null | undefined;
let cachedAuthSnapshot: AuthSnapshot = EMPTY_AUTH_SNAPSHOT;

function parseStoredUser(rawUser: string | null) {
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

function subscribeToAuth(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_UPDATED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(AUTH_UPDATED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getAuthSnapshot() {
  if (typeof window === "undefined") {
    return SERVER_AUTH_SNAPSHOT;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (rawUser === cachedRawUser) {
    return cachedAuthSnapshot;
  }

  const parsedUser = parseStoredUser(rawUser);

  if (!parsedUser && rawUser) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    cachedRawUser = null;
    cachedAuthSnapshot = EMPTY_AUTH_SNAPSHOT;
    return cachedAuthSnapshot;
  }

  cachedRawUser = rawUser;
  cachedAuthSnapshot = parsedUser ? { user: parsedUser, loading: false } : EMPTY_AUTH_SNAPSHOT;

  return cachedAuthSnapshot;
}

function getServerAuthSnapshot() {
  return SERVER_AUTH_SNAPSHOT;
}

function writeStoredSession(user: User, token: string) {
  if (typeof window === "undefined") {
    return;
  }

  const rawUser = JSON.stringify(user);
  cachedRawUser = rawUser;
  cachedAuthSnapshot = { user, loading: false };

  window.localStorage.setItem(AUTH_STORAGE_KEY, rawUser);
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  cachedRawUser = null;
  cachedAuthSnapshot = EMPTY_AUTH_SNAPSHOT;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authState = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getServerAuthSnapshot);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || "Login failed" };

      writeStoredSession(data.user, data.token);
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error || "Registration failed" };

      writeStoredSession(result.user, result.token);
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
  }, []);

  return <AuthContext.Provider value={{ user: authState.user, loading: authState.loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
