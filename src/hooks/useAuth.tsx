import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { User } from "../types";

interface Ctx { loading: boolean; user: User | null; loggedIn: boolean; signUp: (n: string, pin?: string) => Promise<void>; login: (pin?: string) => Promise<void>; logout: () => Promise<void>; reload: () => Promise<void> }
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<{ loading: boolean; user: User | null; loggedIn: boolean }>({ loading: true, user: null, loggedIn: false });
  const reload = useCallback(async () => set({ loading: false, ...(await authService.load()) }), []);
  useEffect(() => { reload().catch(() => set({ loading: false, user: null, loggedIn: false })); }, [reload]);
  const value = useMemo<Ctx>(() => ({
    ...s, reload,
    signUp: async (n, pin) => { await authService.createProfile(n, pin); await reload(); },
    login: async (pin) => { if (s.user) { await authService.login(s.user, pin); await reload(); } },
    logout: async () => { await authService.logout(); await reload(); },
  }), [s, reload]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error("AuthProvider missing"); return c; };
