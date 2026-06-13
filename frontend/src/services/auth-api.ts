import { API_BASE_URL } from "@/lib/config";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/types/auth";

function parseErrorDetail(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "Request failed";
  }

  const detail = (body as { detail?: unknown }).detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "object" && first && "msg" in first) {
      return String((first as { msg: string }).msg);
    }
  }

  return "Request failed";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(parseErrorDetail(body));
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthUser> {
    return request<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload): Promise<AuthUser> {
    return request<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
