/**
 * API service layer — bridges frontend to FastAPI backend.
 * All endpoints now call the real FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Types ───────────────────────────────────────────────────────────

export interface RewardItem {
  type: 'basic_exp' | 'advanced_exp' | 'promotion_ticket';
  name: string;
  quantity: number;
}

export interface Problem {
  id: string;
  difficulty: 'Easy' | 'Hard';
  question: string;
  rewards: RewardItem[];
  firstClearBonus?: RewardItem[];
  completed?: boolean;
  bestScore?: number;
}

export interface Stage {
  id: string;
  name: string;
  topic: string;
  problems: Problem[];
  unlocked: boolean;
  cleared: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  stages: Stage[];
  available: boolean;
}

export interface Mission {
  id: string;
  description: string;
  target: number;
  current: number;
  rewards: RewardItem[];
  claimed: boolean;
}

export interface Inventory {
  basic_exp: number;
  advanced_exp: number;
  promotion_ticket: number;
}

export interface UserProfile {
  level: number;
  exp: number;
  elite: number;
  inventory: Inventory;
  competencies: { name: string; fullName: string; value: number }[];
}

export interface ChallengeResult {
  correct: boolean;
  rewards: RewardItem[];
  feedback: string;
}

// ─── Helper ──────────────────────────────────────────────────────────

// Simple user ID — in production, this would come from auth
const USER_ID = 'default';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  // Only set Content-Type for non-FormData requests
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

// snake_case → camelCase converter for API responses
function toCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v),
      ])
    );
  }
  return obj;
}

// ─── Chapter endpoints ───────────────────────────────────────────────

export async function fetchChapters(): Promise<Chapter[]> {
  const data = await request<unknown[]>(`/chapters/?user_id=${USER_ID}`);
  return toCamel(data) as Chapter[];
}

export async function fetchChapter(id: string): Promise<Chapter> {
  const data = await request<unknown>(`/chapters/${id}?user_id=${USER_ID}`);
  return toCamel(data) as Chapter;
}

// ─── Challenge endpoint ──────────────────────────────────────────────

export async function submitChallenge(problemId: string, answer: string): Promise<ChallengeResult> {
  const data = await request<unknown>('/challenge/', {
    method: 'POST',
    body: JSON.stringify({ problem_id: problemId, answer, user_id: USER_ID }),
  });
  return toCamel(data) as ChallengeResult;
}

// ─── Mission endpoints ───────────────────────────────────────────────

export async function fetchMissions(type: 'daily' | 'weekly'): Promise<Mission[]> {
  const data = await request<unknown[]>(`/missions/?type=${type}&user_id=${USER_ID}`);
  return toCamel(data) as Mission[];
}

export async function claimMission(id: string): Promise<RewardItem[]> {
  const data = await request<unknown[]>(`/missions/${id}/claim?user_id=${USER_ID}`, {
    method: 'POST',
  });
  return toCamel(data) as RewardItem[];
}

// ─── User endpoints ──────────────────────────────────────────────────

export async function fetchUserProfile(): Promise<UserProfile> {
  const data = await request<unknown>(`/user/profile?user_id=${USER_ID}`);
  return toCamel(data) as UserProfile;
}

export async function useExpCards(type: string, count: number): Promise<UserProfile> {
  const data = await request<unknown>(`/user/exp?user_id=${USER_ID}`, {
    method: 'POST',
    body: JSON.stringify({ type, count }),
  });
  return toCamel(data) as UserProfile;
}

export async function promote(): Promise<UserProfile> {
  const data = await request<unknown>(`/user/promote?user_id=${USER_ID}`, {
    method: 'POST',
  });
  return toCamel(data) as UserProfile;
}

// ─── OCR endpoint ────────────────────────────────────────────────────

export async function ocrAnalyze(imageFile: File): Promise<Problem> {
  const form = new FormData();
  form.append('image', imageFile);
  const data = await request<unknown>('/ocr/analyze', {
    method: 'POST',
    body: form,
    headers: {}, // let browser set Content-Type for FormData
  });
  return toCamel(data) as Problem;
}
