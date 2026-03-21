/**
 * API service layer — bridges frontend to FastAPI backend.
 *
 * All functions currently return stub/mock data.
 * To connect the real backend, replace stubs with `request<T>(...)` calls
 * and set VITE_API_URL in .env (default: http://localhost:8000/api).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Stub data (mirrors mockData.ts) ─────────────────────────────────

import { CHAPTERS, DAILY_MISSIONS, WEEKLY_MISSIONS, COMPETENCIES } from '@/data/mockData';

// ─── Chapter endpoints ───────────────────────────────────────────────

export async function fetchChapters(): Promise<Chapter[]> {
  // TODO: Replace with → return request<Chapter[]>('/chapters');
  return JSON.parse(JSON.stringify(CHAPTERS));
}

export async function fetchChapter(id: string): Promise<Chapter> {
  // TODO: Replace with → return request<Chapter>(`/chapters/${id}`);
  const ch = CHAPTERS.find(c => c.id === id);
  if (!ch) throw new Error(`Chapter ${id} not found`);
  return JSON.parse(JSON.stringify(ch));
}

// ─── Challenge endpoint ──────────────────────────────────────────────

export async function submitChallenge(_problemId: string, _answer: string): Promise<ChallengeResult> {
  // TODO: Replace with → return request<ChallengeResult>('/challenge', {
  //   method: 'POST', body: JSON.stringify({ problemId: _problemId, answer: _answer }),
  // });
  return {
    correct: true,
    rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 1 }],
    feedback: '回答正确！',
  };
}

// ─── Mission endpoints ───────────────────────────────────────────────

export async function fetchMissions(type: 'daily' | 'weekly'): Promise<Mission[]> {
  // TODO: Replace with → return request<Mission[]>(`/missions?type=${type}`);
  const data = type === 'daily' ? DAILY_MISSIONS : WEEKLY_MISSIONS;
  return JSON.parse(JSON.stringify(data));
}

export async function claimMission(id: string): Promise<RewardItem[]> {
  // TODO: Replace with → return request<RewardItem[]>(`/missions/${id}/claim`, { method: 'POST' });
  return [{ type: 'basic_exp', name: '基础经验卡', quantity: 2 }];
}

// ─── User endpoints ──────────────────────────────────────────────────

export async function fetchUserProfile(): Promise<UserProfile> {
  // TODO: Replace with → return request<UserProfile>('/user/profile');
  return {
    level: 26,
    exp: 4038,
    elite: 0,
    inventory: { basic_exp: 213, advanced_exp: 1056, promotion_ticket: 17 },
    competencies: COMPETENCIES,
  };
}

export async function useExpCards(_type: string, _count: number): Promise<UserProfile> {
  // TODO: Replace with → return request<UserProfile>('/user/exp', { method: 'POST', body: JSON.stringify({ type, count }) });
  return fetchUserProfile();
}

export async function promote(): Promise<UserProfile> {
  // TODO: Replace with → return request<UserProfile>('/user/promote', { method: 'POST' });
  return fetchUserProfile();
}

// ─── OCR endpoint ────────────────────────────────────────────────────

export async function ocrAnalyze(_imageFile: File): Promise<Problem> {
  // TODO: Replace with real multipart upload:
  // const form = new FormData();
  // form.append('image', _imageFile);
  // return request<Problem>('/ocr/analyze', { method: 'POST', body: form, headers: {} });
  return {
    id: 'ocr-1',
    difficulty: 'Easy',
    question: '判断 f(x)=ln(x+√(1+x²)) 的奇偶性。',
    rewards: [{ type: 'basic_exp', name: '基础经验卡', quantity: 1 }],
  };
}
