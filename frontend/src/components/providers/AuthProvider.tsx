"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearSession,
  clearGuestMode,
  getAuthUser,
  isGuestMode,
  setAuthUser as persistAuthUser,
  setGuestMode as persistGuestMode,
} from "@/store/auth-storage";
import type { AuthUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isGuest: boolean;
  isReady: boolean;
  canAccessDashboard: boolean;
  login: (user: AuthUser) => void;
  enterGuest: () => void;
  exitGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(getAuthUser());
    setIsGuest(isGuestMode());
    setIsReady(true);
  }, []);

  const login = useCallback((nextUser: AuthUser) => {
    persistAuthUser(nextUser);
    setUser(nextUser);
    setIsGuest(false);
  }, []);

  const enterGuest = useCallback(() => {
    persistGuestMode();
    setUser(null);
    setIsGuest(true);
  }, []);

  const exitGuest = useCallback(() => {
    clearGuestMode();
    setIsGuest(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsGuest(false);
  }, []);

  const canAccessDashboard = Boolean(user || isGuest || isGuestMode());

  const value = useMemo(
    () => ({
      user,
      isGuest,
      isReady,
      canAccessDashboard,
      login,
      enterGuest,
      exitGuest,
      logout,
    }),
    [user, isGuest, isReady, canAccessDashboard, login, enterGuest, exitGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
