import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/auth-service';
import { STORAGE_KEYS } from '@/config/constants';
import type { User, LoginRequest } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Foundation-phase auth boundary: localStorage token, same pattern as react-template-main.
// This is intentionally NOT the final implementation — AUTH-RBAC.md targets JWT via
// Authorization: Bearer or the go-template-main cookie (stl_token) plus RequireRole()
// enforcement on the backend. Swap this provider's storage/transport when that lands;
// components consuming useAuth() should not need to change.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with AuthProvider, same shape as react-template-main's own AuthContext.tsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
