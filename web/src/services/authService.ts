export interface RegistrationRequestModel {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequestModel {
  email: string;
  password: string;
}

export interface UserResponseModel {
  id?: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  [key: string]: unknown;
}

export interface TokensModel {
  access_token: string;
  token_type?: string;
}

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

const TOKEN_STORAGE_KEY = 'naumen_auth_tokens';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');

function buildFormBody(payload: Record<string, string>) {
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    form.set(key, value);
  });
  return form.toString();
}

async function extractErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item?.msg === 'string') {
            return item.msg;
          }
          return JSON.stringify(item);
        })
        .join(', ');
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }
  } catch {
    // Ignore invalid body and fallback to status text.
  }

  return response.statusText || 'Ошибка запроса.';
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new AuthApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: RegistrationRequestModel) {
  return requestJson<UserResponseModel>(`${API_BASE_URL}/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginRequestModel) {
  return requestJson<TokensModel>(`${API_BASE_URL}/login/access-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildFormBody({
      username: payload.email,
      password: payload.password,
      grant_type: 'password',
      scope: '',
    }),
  });
}

export async function getCurrentUser(accessToken: string) {
  return requestJson<UserResponseModel>(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function saveStoredTokens(tokens: TokensModel) {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify({
      access_token: tokens.access_token,
      token_type: tokens.token_type ?? 'bearer',
    })
  );
}

export function loadStoredTokens() {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TokensModel>;
    if (typeof parsed.access_token === 'string') {
      return {
        access_token: parsed.access_token,
        token_type: typeof parsed.token_type === 'string' ? parsed.token_type : 'bearer',
      };
    }
  } catch {
    // Ignore malformed storage and fallback to null.
  }

  return null;
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
