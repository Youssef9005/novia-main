"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/http';

export interface AuthUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  emailVerified?: boolean;
  subscription?: {
    status: 'active' | 'cancelled' | 'expired';
    plan?: string;
    endDate?: string;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (payload: any) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string, passwordConfirm: string) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<{ status: string; data: { user: AuthUser } }>("/api/auth/me", {
        method: 'GET',
      });
      setUser(data?.data?.user || null);
    } catch (err: any) {
      setUser(null);
      // Do not set error here to avoid noisy global errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api/auth/login", {
        method: 'POST',
        body: { email, password },
      });
      const nextUser = data?.data?.user || null;
      // Persist token and user info for components relying on localStorage
      if (data?.token) {
        try {
          localStorage.setItem('token', data.token);
        } catch {}
      }
      if (nextUser) {
        try {
          localStorage.setItem('userInfo', JSON.stringify({
            firstName: nextUser.firstName,
            lastName: nextUser.lastName,
            email: nextUser.email,
          }));
        } catch {}
      }
      setUser(nextUser);
      return data;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await apiFetch("/api/auth/logout", { method: 'GET' });
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (payload: any) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api/auth/signup", {
        method: 'POST',
        body: payload,
      });
      const nextUser = data?.data?.user || null;
      // Persist token and user info for components relying on localStorage
      if (data?.token) {
        try {
          localStorage.setItem('token', data.token);
        } catch {}
      }
      if (nextUser) {
        try {
          localStorage.setItem('userInfo', JSON.stringify({
            firstName: nextUser.firstName,
            lastName: nextUser.lastName,
            email: nextUser.email,
          }));
        } catch {}
      }
      setUser(nextUser);
      return data;
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api/auth/forgot-password", {
        method: 'POST',
        body: { email },
      });
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string, passwordConfirm: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch(`/api/auth/reset-password/${token}`, {
        method: 'PATCH',
        body: { password, passwordConfirm },
      });
      const nextUser = data?.data?.user || null;
      // Persist token and user info for components relying on localStorage
      if (data?.token) {
        try {
          localStorage.setItem('token', data.token);
        } catch {}
      }
      if (nextUser) {
        try {
          localStorage.setItem('userInfo', JSON.stringify({
            firstName: nextUser.firstName,
            lastName: nextUser.lastName,
            email: nextUser.email,
          }));
        } catch {}
      }
      setUser(nextUser);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch(`/api/auth/verify-email/${token}`, {
        method: 'GET',
      });
      const nextUser = data?.data?.user || null; // verify may return user+token
      // Persist token and user info for components relying on localStorage
      if (data?.token) {
        try {
          localStorage.setItem('token', data.token);
        } catch {}
      }
      if (nextUser) {
        try {
          localStorage.setItem('userInfo', JSON.stringify({
            firstName: nextUser.firstName,
            lastName: nextUser.lastName,
            email: nextUser.email,
          }));
        } catch {}
      }
      if (nextUser) setUser(nextUser);
      return data;
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email },
      });
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    refreshUser,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
  }), [user, loading, error, refreshUser, login, logout, signup, forgotPassword, resetPassword, verifyEmail, resendVerification]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}