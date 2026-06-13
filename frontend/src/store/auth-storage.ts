import type { AuthUser } from "@/types/auth";

const AUTH_KEY = "zoom-clone-user";
const GUEST_KEY = "zoom-clone-guest";

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  localStorage.removeItem(GUEST_KEY);
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GUEST_KEY) === "true";
}

export function setGuestMode(): void {
  localStorage.setItem(GUEST_KEY, "true");
  localStorage.removeItem(AUTH_KEY);
}

export function clearGuestMode(): void {
  localStorage.removeItem(GUEST_KEY);
}

export function clearSession(): void {
  clearAuthUser();
  clearGuestMode();
}

export function getPostMeetingRedirectPath(): string {
  if (getAuthUser() || isGuestMode()) {
    return "/dashboard";
  }
  return "/";
}
