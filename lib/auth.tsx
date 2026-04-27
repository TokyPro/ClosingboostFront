'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ['/login'];
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'sb_token';

export function AuthProvider({ children, locale }: { children: React.ReactNode; locale: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.replace(`/${locale}/login`);
  }, [router, locale]);

  // Load token + fetch user on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('invalid');
        return r.json() as Promise<AuthUser>;
      })
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Route guard
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.endsWith(p));
    if (!user && !isPublic) {
      router.replace(`/${locale}/login`);
    } else if (user && isPublic) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [loading, user, pathname, router, locale]);

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { detail?: string }).detail || 'Erreur de connexion');
    }
    const { access_token } = (await res.json()) as { access_token: string };
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const me = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    }).then((r) => r.json() as Promise<AuthUser>);
    setUser(me);
    router.replace(`/${locale}/dashboard`);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { detail?: string }).detail || "Erreur lors de l'inscription");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
