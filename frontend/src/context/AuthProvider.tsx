import React, { useState, useEffect } from 'react';
import api, { setAccessTokenInMemory, refreshAccessToken, registerAuthFailureCallback } from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from HTTP-only cookie on boot
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await refreshAccessToken();
        if (token) {
          try {
            const response = await api.get<{ userId: string; fullName: string; email: string; createdAt?: string; role?: string }>('/users/me');
            const freshUser = response.data;
            setUser(freshUser);
            localStorage.setItem('budgetsetu_user_profile', JSON.stringify(freshUser));
          } catch (profileErr) {
            console.error('Failed to fetch fresh profile', profileErr);
            // Fallback to local storage
            const savedUser = localStorage.getItem('budgetsetu_user_profile');
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            } else {
              setUser({ userId: 'current', email: '', fullName: 'User' });
            }
          }
        }
      } catch (e) {
        if (e && typeof e === 'object' && 'response' in e) {
          const err = e as { response?: { status?: number } };
          if (err.response && err.response.status && err.response.status >= 400 && err.response.status < 500) {
            localStorage.removeItem('budgetsetu_user_profile');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    registerAuthFailureCallback(() => {
      setUser(null);
      localStorage.removeItem('budgetsetu_user_profile');
    });

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string; userId: string; fullName: string; email: string; createdAt?: string; role?: string }>(
      '/auth/login',
      { email, password }
    );
    const { accessToken, userId, fullName, email: userEmail, createdAt, role } = response.data;
    
    setAccessTokenInMemory(accessToken);
    const loggedInUser = { userId, fullName, email: userEmail, createdAt, role };
    setUser(loggedInUser);
    localStorage.setItem('budgetsetu_user_profile', JSON.stringify(loggedInUser));
  };

  const register = async (fullName: string, email: string, password: string) => {
    await api.post('/auth/register', { fullName, email, password });
  };

  const forgotPassword = async (email: string) => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return response.data.message;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      setAccessTokenInMemory(null);
      setUser(null);
      localStorage.removeItem('budgetsetu_user_profile');
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('budgetsetu_user_profile', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPassword, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
