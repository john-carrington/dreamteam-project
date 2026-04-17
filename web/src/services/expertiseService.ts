import { SkillLevel, SkillType, User } from '@/types';
import { AuthApiError, loadStoredTokens } from './authService';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');

function getAccessTokenOrThrow() {
  const tokens = loadStoredTokens();
  if (!tokens?.access_token) {
    throw new AuthApiError('Сессия не найдена. Выполните вход заново.', 401);
  }
  return tokens.access_token;
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
    // Ignore and fallback to status text.
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

function authHeaders() {
  const accessToken = getAccessTokenOrThrow();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchExpertUsers() {
  return requestJson<User[]>(`${API_BASE_URL}/expertise/users`, {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function fetchMyExpertProfile() {
  return requestJson<User>(`${API_BASE_URL}/expertise/me`, {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function updateMyExpertProfile(payload: {
  name?: string;
  avatar?: string;
  title?: string;
  department?: string;
  experience?: {
    projects: string;
    speaking: string;
    mentoring: string;
  };
  readiness?: {
    speaker: boolean;
    mentor: boolean;
    jury: boolean;
  };
}) {
  return requestJson<User>(`${API_BASE_URL}/expertise/me`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function createMySkill(payload: {
  name: string;
  type: SkillType;
  level: SkillLevel;
}) {
  return requestJson<User>(`${API_BASE_URL}/expertise/me/skills`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function patchMySkill(
  skillId: string,
  payload: Partial<{
    name: string;
    type: SkillType;
    level: SkillLevel;
  }>
) {
  return requestJson<User>(`${API_BASE_URL}/expertise/me/skills/${skillId}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteMySkill(skillId: string) {
  return requestJson<{ message: string }>(`${API_BASE_URL}/expertise/me/skills/${skillId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function endorseSkillApi(skillId: string) {
  return requestJson<{ skill_id: string; count: number; endorsers: string[] }>(
    `${API_BASE_URL}/expertise/skills/${skillId}/endorse`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  );
}

export async function removeEndorsementApi(skillId: string) {
  return requestJson<{ message: string }>(`${API_BASE_URL}/expertise/skills/${skillId}/endorse`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function searchExpertsApi(params: {
  query?: string;
  skill?: string;
  level?: SkillLevel;
  activityType?: 'speaker' | 'mentor' | 'jury';
  readyOnly?: boolean;
  sortBy?: 'endorsements' | 'relevance';
}) {
  const query = new URLSearchParams();

  if (params.query) query.set('query', params.query);
  if (params.skill) query.set('skill', params.skill);
  if (params.level) query.set('level', params.level);
  if (params.activityType) query.set('activity_type', params.activityType);
  if (typeof params.readyOnly === 'boolean') query.set('ready_only', String(params.readyOnly));
  if (params.sortBy) query.set('sort_by', params.sortBy);

  const suffix = query.toString() ? `?${query.toString()}` : '';

  return requestJson<User[]>(`${API_BASE_URL}/expertise/search${suffix}`, {
    method: 'GET',
    headers: authHeaders(),
  });
}

export async function createInvitationApi(payload: {
  candidateUserId: string;
  activityType: 'speaker' | 'mentor' | 'jury';
  queryText?: string;
  message?: string;
}) {
  return requestJson(`${API_BASE_URL}/expertise/invitations`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidate_user_id: payload.candidateUserId,
      activity_type: payload.activityType,
      query_text: payload.queryText ?? '',
      message: payload.message ?? '',
    }),
  });
}
