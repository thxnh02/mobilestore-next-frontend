'use client';

import { ApiError, api } from '@/lib/api';
import { AuthResponse, User } from '@/lib/types';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type AuthContextValue = {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  expiresAtUtc: string | null;
  refreshTokenExpiresAtUtc: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'ms_token';
const REFRESH_TOKEN_KEY = 'ms_refresh_token';
const USER_KEY = 'ms_user';
const EXPIRES_KEY = 'ms_token_expires';
const REFRESH_EXPIRES_KEY = 'ms_refresh_token_expires';
const REFRESH_BUFFER_MS = 60 * 1000;

function getTimeLeft(value?: string | null) {
  if (!value) return 0;
  return new Date(value).getTime() - Date.now();
}

function isExpired(value?: string | null) {
  return getTimeLeft(value) <= 0;
}

function readUser(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [expiresAtUtc, setExpiresAtUtc] = useState<string | null>(null);
  const [refreshTokenExpiresAtUtc, setRefreshTokenExpiresAtUtc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = readUser(localStorage.getItem(USER_KEY));
      const storedExpires = localStorage.getItem(EXPIRES_KEY);
      const storedRefreshExpires = localStorage.getItem(REFRESH_EXPIRES_KEY);

      if (storedToken && storedUser && !isExpired(storedExpires)) {
        if (!alive) return;
        setSession({
          token: storedToken,
          refreshToken: storedRefreshToken,
          expiresAtUtc: storedExpires,
          refreshTokenExpiresAtUtc: storedRefreshExpires,
          user: storedUser,
        });
        setIsLoading(false);
        return;
      }

      if (storedRefreshToken && !isExpired(storedRefreshExpires)) {
        const ok = await refreshSessionInternal(storedRefreshToken);
        if (!alive) return;
        if (!ok) clearSession();
        setIsLoading(false);
        return;
      }

      clearSession();
      if (alive) setIsLoading(false);
    }

    void bootstrap();
    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!token || !expiresAtUtc || isLoading) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const timeout = Math.max(getTimeLeft(expiresAtUtc) - REFRESH_BUFFER_MS, 0);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void refreshSession();
    }, timeout);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token, expiresAtUtc, isLoading]);

  useEffect(() => {
    if (!token || isLoading) return;
    void refreshProfile().catch(() => undefined);
  }, [token, isLoading]);

  function persistSession(data: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(EXPIRES_KEY, data.expiresAtUtc);
    localStorage.setItem(REFRESH_EXPIRES_KEY, data.refreshTokenExpiresAtUtc);
  }

  function setSession(data: { token: string | null; refreshToken: string | null; expiresAtUtc: string | null; refreshTokenExpiresAtUtc: string | null; user: User | null }) {
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setExpiresAtUtc(data.expiresAtUtc);
    setRefreshTokenExpiresAtUtc(data.refreshTokenExpiresAtUtc);
    setUser(data.user);
  }

  function clearStorage() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem(REFRESH_EXPIRES_KEY);
  }

  function clearSession() {
    setSession({ token: null, refreshToken: null, expiresAtUtc: null, refreshTokenExpiresAtUtc: null, user: null });
    clearStorage();
  }

  async function refreshSessionInternal(activeRefreshToken?: string | null) {
    const tokenToUse = activeRefreshToken || refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY);
    const refreshExpiry = refreshTokenExpiresAtUtc || localStorage.getItem(REFRESH_EXPIRES_KEY);

    if (!tokenToUse || isExpired(refreshExpiry)) {
      clearSession();
      return false;
    }

    try {
      const result = await api.refresh(tokenToUse);
      persistSession(result);
      setSession({
        token: result.token,
        refreshToken: result.refreshToken,
        expiresAtUtc: result.expiresAtUtc,
        refreshTokenExpiresAtUtc: result.refreshTokenExpiresAtUtc,
        user: result.user,
      });
      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  async function refreshSession() {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    refreshPromiseRef.current = refreshSessionInternal().finally(() => {
      refreshPromiseRef.current = null;
    });
    return refreshPromiseRef.current;
  }

  async function refreshProfile() {
    if (!token) return;
    try {
      const profile = await api.me(token);
      setUser(profile);
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) throw error;
        const retryToken = localStorage.getItem(TOKEN_KEY);
        if (!retryToken) throw error;
        const profile = await api.me(retryToken);
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        return;
      }
      throw error;
    }
  }

  async function login(data: AuthResponse) {
    persistSession(data);
    setSession({
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAtUtc: data.expiresAtUtc,
      refreshTokenExpiresAtUtc: data.refreshTokenExpiresAtUtc,
      user: data.user,
    });
    setIsLoading(false);
  }

  async function logout() {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    clearSession();
    setIsLoading(false);
    if (activeToken) {
      try {
        await api.logout(activeToken);
      } catch {
        // ignore logout network errors because local session is already cleared
      }
    }
  }

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      user,
      expiresAtUtc,
      refreshTokenExpiresAtUtc,
      isAuthenticated: !!token && !!user && !isExpired(expiresAtUtc),
      isAdmin: user?.role === 'Admin',
      isLoading,
      login,
      logout,
      refreshProfile,
      refreshSession,
    }),
    [token, refreshToken, user, expiresAtUtc, refreshTokenExpiresAtUtc, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
