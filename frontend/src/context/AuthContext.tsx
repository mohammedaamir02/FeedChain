import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as api from '../api/client';

type User = { user_id: string; role: 'donor' | 'ngo' | 'admin' };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (role: 'donor' | 'ngo' | 'admin') => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ role: string }>;
  register: (email: string, password: string, role: 'donor' | 'ngo' | 'admin') => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_USER = 'feedchain_user';

// TEMPORARY: Demo mode - hardcode user for testing
const DEMO_MODE = true;

// Generate different user IDs for different roles
function getDemoUser(role: 'donor' | 'ngo' | 'admin'): User {
  const userIds = {
    donor: 'demo-0000-0000-0000-000000000000',
    ngo: 'ngo-demo-0000-0000-0000-0000000000000',
    admin: 'admin-demo-0000-0000-0000-0000000000',
  };
  return {
    user_id: userIds[role],
    role,
  };
}

const DEMO_USER: User = getDemoUser('donor');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    // If demo mode is enabled, use demo user
    if (DEMO_MODE) {
      localStorage.setItem(STORAGE_USER, JSON.stringify(DEMO_USER));
      localStorage.setItem('feedchain_token', 'demo-token-' + Date.now());
      return DEMO_USER;
    }
    try {
      const raw = localStorage.getItem(STORAGE_USER);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_USER);
  }, []);

  const login = useCallback(async (role: 'donor' | 'ngo' | 'admin') => {
    if (DEMO_MODE) {
      const demoUser = getDemoUser(role);
      localStorage.setItem('feedchain_user', JSON.stringify(demoUser));
      localStorage.setItem('feedchain_token', 'demo-token-' + Date.now());
      setUser(demoUser);
      return;
    }
    const res = await api.auth.loginWithRole(role);
    localStorage.setItem('feedchain_token', res.access_token);
    setUser({ user_id: res.user_id, role: res.role });
  }, [setUser]);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    if (DEMO_MODE) {
      const demoUser = { ...DEMO_USER, role: 'donor' as const };
      localStorage.setItem('feedchain_token', 'demo-token-' + Date.now());
      setUser(demoUser);
      return { role: demoUser.role };
    }
    const res = await api.auth.loginWithPassword(email, password);
    localStorage.setItem('feedchain_token', res.access_token);
    setUser({ user_id: res.user_id, role: res.role });
    return { role: res.role };
  }, [setUser]);

  const register = useCallback(async (email: string, password: string, role: 'donor' | 'ngo' | 'admin') => {
    if (DEMO_MODE) {
      const demoUser = getDemoUser(role);
      localStorage.setItem('feedchain_user', JSON.stringify(demoUser));
      localStorage.setItem('feedchain_token', 'demo-token-' + Date.now());
      setUser(demoUser);
      return;
    }
    await api.auth.register({ email, password, role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('feedchain_token');
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('feedchain_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then((me) => setUser(me))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [setUser]);

  useEffect(() => {
    const onUnauth = () => setUser(null);
    window.addEventListener('feedchain_unauthorized', onUnauth);
    return () => window.removeEventListener('feedchain_unauthorized', onUnauth);
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithPassword, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
