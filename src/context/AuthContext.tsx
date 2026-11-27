'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Role } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

const AUTH_CACHE_KEY = 'angels_auth_user_cache';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start identical on server and client to avoid React hydration mismatches
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
          }
        } else {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_CACHE_KEY);
          }
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_CACHE_KEY);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
    refreshUser();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (formData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_CACHE_KEY);
      }
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
