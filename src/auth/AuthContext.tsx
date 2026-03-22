import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { apiFetch } from '@/api/apiFetch';

const AUTH_KEY = 'healthineer_auth';
const TOKEN_KEY = 'healthineer_token';

interface AuthLoginResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

function mapBackendRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
    NURSE: 'nurse',
  };
  return map[role] ?? 'doctor';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(AUTH_KEY);
    if (token && stored) {
      const { user } = JSON.parse(stored) as { user: User };
      if (user?.id) return { user, isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStored);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      localStorage.removeItem('healthineer_token');
      const res = await apiFetch<AuthLoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      });

      const user: User = {
        id: String(res.userId),
        name: res.fullName,
        role: mapBackendRole(res.role),
        email: `${res.username}@hospital.com`,
      };

      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user }));
      setState({ user, isAuthenticated: true });
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      return msg;
    }
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isAuthenticated: false });
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
