import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/auth';
import { LoginRequest, MfaChallenge, User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  loading: boolean;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  pendingChallenge: MfaChallenge | null;
  login: (credentials: LoginRequest) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  cancelMfaChallenge: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState<MfaChallenge | null>(null);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setPermissions(parsedUser.permissions ?? []);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const applySession = (sessionToken: string, sessionUser: User, sessionPermissions: string[]) => {
    localStorage.setItem('token', sessionToken);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    setToken(sessionToken);
    setUser(sessionUser);
    setPermissions(sessionPermissions);
    setMfaRequired(false);
    setPendingChallenge(null);
  };

  const login = async (credentials: LoginRequest) => {
    const response = await authAPI.login(credentials);

    if (response.mfaRequired) {
      setMfaRequired(true);
      setPendingChallenge({ challengeToken: response.token });
      return;
    }

    applySession(response.token, response.user, response.permissions);
  };

  const verifyMfa = async (code: string) => {
    if (!pendingChallenge) {
      throw new Error('No pending MFA challenge');
    }

    const response = await authAPI.verifyMfa({
      challengeToken: pendingChallenge.challengeToken,
      code,
    });

    applySession(response.token, response.user, response.permissions);
  };

  const cancelMfaChallenge = () => {
    setMfaRequired(false);
    setPendingChallenge(null);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setPermissions([]);
      setMfaRequired(false);
      setPendingChallenge(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    token,
    permissions,
    loading,
    isAuthenticated: !!token,
    mfaRequired,
    pendingChallenge,
    login,
    verifyMfa,
    cancelMfaChallenge,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
