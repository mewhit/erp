import { apiBaseUrl } from "../config";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

const storageKey = "erp-user-auth-session";

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  const body = (await response.json()) as { data: AuthSession };
  return body.data;
}

export function getStoredSession(): AuthSession | undefined {
  const rawSession = window.localStorage.getItem(storageKey);

  if (rawSession === null) {
    return undefined;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return undefined;
  }
}

export function storeSession(session: AuthSession): void {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(storageKey);
}
