const REMEMBERED_NAME_KEY = "zoom-clone-remembered-name";

export function getRememberedName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBERED_NAME_KEY);
}

export function setRememberedName(name: string): void {
  localStorage.setItem(REMEMBERED_NAME_KEY, name);
}

export function clearRememberedName(): void {
  localStorage.removeItem(REMEMBERED_NAME_KEY);
}
