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

type LoginResponse = {
  data: {
    token: string;
  };
};

type MeResponse = {
  data: {
    userId: string;
  };
};

type UserResponse = {
  data: AuthUser;
};

const storageKey = "erp-admin-auth-session";

async function requestCurrentUser(token: string): Promise<AuthUser> {
  const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!meResponse.ok) {
    throw new Error("Unable to load current user");
  }

  const meBody = (await meResponse.json()) as MeResponse;
  const userResponse = await fetch(`${apiBaseUrl}/users/${meBody.data.userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!userResponse.ok) {
    throw new Error("Unable to load current user profile");
  }

  const userBody = (await userResponse.json()) as UserResponse;
  return userBody.data;
}

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

  const body = (await response.json()) as LoginResponse;
  const user = await requestCurrentUser(body.data.token);

  return {
    token: body.data.token,
    user
  };
}

export function getStoredSession(): AuthSession | undefined {
  const rawSession = window.localStorage.getItem(storageKey);

  if (rawSession === null) {
    return undefined;
  }

  try {
    const session = JSON.parse(rawSession) as Partial<AuthSession>;

    if (
      typeof session.token !== "string" ||
      typeof session.user !== "object" ||
      session.user === null ||
      typeof session.user.name !== "string"
    ) {
      window.localStorage.removeItem(storageKey);
      return undefined;
    }

    return session as AuthSession;
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
