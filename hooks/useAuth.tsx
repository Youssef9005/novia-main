
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, RegisterData, UpdateUserData } from '@/lib/api';

interface User {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role?: string;
  wallet?: string;
  phone?: string;
  selectedAssets?: string[];
  [key: string]: unknown;
}

interface AuthResponse {
  status: string;
  token?: string;
  data?: {
    user?: User;
    token?: string;
  };
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (token: string, p1: string, p2: string) => Promise<AuthResponse>;
  verifyEmail: (token: string) => Promise<AuthResponse>;
  updateProfile: (data: UpdateUserData) => Promise<AuthResponse>;
  changePassword: (current: string, newPass: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      // Optimistically load user from localStorage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      }

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.users.me();
        if (res.status === 'success' && res.data && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } else {
          // Token is invalid or expired
          console.warn('Token validation failed:', res);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res: AuthResponse = await api.auth.login(email, pass);
      if (res.status === 'success') {
        const token = res.token || res.data?.token;
        const user = res.data?.user;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
        
        return res;
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: RegisterData) => {
    setLoading(true);
    try {
      const res: AuthResponse = await api.auth.register(data);
      if (res.status === 'success') {
        const token = res.token || res.data?.token;
        const user = res.data?.user;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
        
        return res;
      }
      throw new Error(res.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const forgotPassword = async (email: string) => {
    return api.auth.forgotPassword(email);
  };

  const resetPassword = async (token: string, p1: string, p2: string) => {
    return api.auth.resetPassword(token, p1, p2);
  };

  const verifyEmail = async (token: string) => {
    return api.auth.verifyEmail(token);
  };

  const updateProfile = async (data: UpdateUserData) => {
    setLoading(true);
    try {
      const res: AuthResponse = await api.users.updateMe(data);
      if (res.status === 'success' && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user || null);
        return res;
      }
      throw new Error(res.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (current: string, newPass: string) => {
    setLoading(true);
    try {
      return await api.users.changePassword(current, newPass);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, forgotPassword, resetPassword, verifyEmail, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: false,
      login: async () => {},
      signup: async () => ({ status: 'fail', message: 'Not initialized' }),
      logout: () => {},
      forgotPassword: async () => ({ status: 'fail', message: 'Not initialized' }),
      resetPassword: async () => ({ status: 'fail', message: 'Not initialized' }),
      verifyEmail: async () => ({ status: 'fail', message: 'Not initialized' }),
      updateProfile: async () => ({ status: 'fail', message: 'Not initialized' }),
      changePassword: async () => ({ status: 'fail', message: 'Not initialized' })
    };
  }
  return context;
}
