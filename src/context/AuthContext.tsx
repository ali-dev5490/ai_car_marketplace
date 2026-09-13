import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PublicUser } from '../types';
import {
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  getToken,
  setToken,
} from '../lib/authApi';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  listingFeePkr: number;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    city: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: PublicUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingFeePkr, setListingFeePkr] = useState(2000);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiMe();
      setUser(data.user);
      setListingFeePkr(data.listing_fee_pkr || 2000);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (input: { name: string; email: string; phone: string; password: string; city: string }) => {
      const data = await apiSignup(input);
      setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      setToken(null);
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      listingFeePkr,
      isAdmin: user?.role === 'admin',
      login,
      signup,
      logout,
      refresh,
      setUser,
    }),
    [user, loading, listingFeePkr, login, signup, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
