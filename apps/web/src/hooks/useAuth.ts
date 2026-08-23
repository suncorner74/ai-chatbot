import { useCallback, useEffect, useState } from 'react';
import * as auth from '../services/authService';
import type { AuthUser } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await auth.getMe();
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await auth.login(email, password);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const result = await auth.register(email, password, name);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
