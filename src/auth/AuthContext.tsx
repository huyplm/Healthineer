import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/api';

const STORAGE_KEY = 'healthineer_auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (name: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { user } = JSON.parse(stored) as { user: User };
      const found = mockUsers.find((u) => u.id === user.id && u.role === user.role);
      if (found) return { user: found, isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStored);

  const login = useCallback((name: string, role: UserRole) => {
    const existing = mockUsers.find((u) => u.role === role);
    const user: User = existing
      ? { ...existing, name: name || existing.name }
      : {
          id: `u_${Date.now()}`,
          name: name || role,
          role,
        };
    setState({ user, isAuthenticated: true });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
