import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CHAPTERS, DAILY_MISSIONS, WEEKLY_MISSIONS, expToNextLevel, COMPETENCIES } from '@/data/mockData';
import type { Chapter, Mission, RewardItem, Problem } from '@/data/mockData';
import * as api from '@/services/api';

interface Inventory {
  basic_exp: number;
  advanced_exp: number;
  promotion_ticket: number;
}

interface GameState {
  elite: number;
  level: number;
  exp: number;
  inventory: Inventory;
  chapters: Chapter[];
  dailyMissions: Mission[];
  weeklyMissions: Mission[];
  currentChapter: string | null;
  settings: { sound: boolean; animation: boolean };
  easyCompleted: number;
  hardCompleted: number;
  loading: boolean;
}

interface GameContextType extends GameState {
  setCurrentChapter: (id: string | null) => void;
  completeChallenge: (problem: Problem) => RewardItem[];
  useExpCard: (type: 'basic_exp' | 'advanced_exp', count: number) => void;
  promote: () => boolean;
  claimMission: (id: string, type: 'daily' | 'weekly') => RewardItem[] | null;
  toggleSetting: (key: 'sound' | 'animation') => void;
  refreshChapters: () => Promise<void>;
  refreshMissions: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  maxLevel: number;
  competencies: { name: string; fullName: string; value: number }[];
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    elite: 0,
    level: 1,
    exp: 0,
    inventory: { basic_exp: 0, advanced_exp: 0, promotion_ticket: 0 },
    chapters: JSON.parse(JSON.stringify(CHAPTERS)),
    dailyMissions: JSON.parse(JSON.stringify(DAILY_MISSIONS)),
    weeklyMissions: JSON.parse(JSON.stringify(WEEKLY_MISSIONS)),
    currentChapter: null,
    settings: { sound: true, animation: true },
    easyCompleted: 0,
    hardCompleted: 0,
    loading: true,
  });

  const [competencies, setCompetencies] = useState(COMPETENCIES);

  const maxLevel = state.elite === 0 ? 50 : 70;

  // Load data from backend on mount
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.fetchUserProfile();
      const inv = profile.inventory as unknown as Record<string, number>;
      setState(s => ({
        ...s,
        level: profile.level,
        exp: profile.exp,
        elite: profile.elite,
        inventory: {
          basic_exp: inv['basicExp'] ?? inv['basic_exp'] ?? 0,
          advanced_exp: inv['advancedExp'] ?? inv['advanced_exp'] ?? 0,
          promotion_ticket: inv['promotionTicket'] ?? inv['promotion_ticket'] ?? 0,
        },
        easyCompleted: profile.easyCompleted || 0,
        hardCompleted: profile.hardCompleted || 0,
        loading: false,
      }));
      setCompetencies(profile.competencies.map(c => ({
        name: c.name,
        fullName: c.fullName,
        value: c.value,
      })));
    } catch (err) {
      console.error('Failed to load profile:', err);
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const refreshChapters = useCallback(async () => {
    try {
      const chapters = await api.fetchChapters();
      setState(s => ({ ...s, chapters }));
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  }, []);

  const refreshMissions = useCallback(async () => {
    try {
      const [daily, weekly] = await Promise.all([
        api.fetchMissions('daily'),
        api.fetchMissions('weekly'),
      ]);
      setState(s => ({ ...s, dailyMissions: daily, weeklyMissions: weekly }));
    } catch (err) {
      console.error('Failed to load missions:', err);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
    refreshChapters();
    refreshMissions();
  }, [refreshProfile, refreshChapters, refreshMissions]);

  const setCurrentChapter = useCallback((id: string | null) => {
    setState(s => ({ ...s, currentChapter: id }));
  }, []);

  const completeChallenge = useCallback((problem: Problem): RewardItem[] => {
    const allRewards = [...problem.rewards, ...(problem.firstClearBonus || [])];
    setState(s => {
      const inv = { ...s.inventory };
      allRewards.forEach(r => {
        if (r.type === 'basic_exp') inv.basic_exp += r.quantity;
        if (r.type === 'advanced_exp') inv.advanced_exp += r.quantity;
        if (r.type === 'promotion_ticket') inv.promotion_ticket += r.quantity;
      });

      const isEasy = problem.difficulty === 'Easy';
      const newEasy = s.easyCompleted + (isEasy ? 1 : 0);
      const newHard = s.hardCompleted + (isEasy ? 0 : 1);

      // Update missions — match Chinese descriptions
      const updateMissions = (missions: Mission[]) =>
        missions.map(m => {
          const desc = m.description;
          if (isEasy && (desc.includes('简单题') || desc.includes('错题') || desc.includes('公式')))
            return { ...m, current: Math.min(m.current + 1, m.target) };
          if (!isEasy && desc.includes('困难题'))
            return { ...m, current: Math.min(m.current + 1, m.target) };
          if (desc.includes('完成') && !desc.includes('简单') && !desc.includes('困难') && !desc.includes('错题') && !desc.includes('公式') && !desc.includes('思维导图'))
            return { ...m, current: Math.min(m.current + 1, m.target) };
          return m;
        });

      // Mark stage cleared and unlock next (DAG)
      const chapters = s.chapters.map(ch => {
        const stageIdx = ch.stages.findIndex(st => st.problems.some(p => p.id === problem.id));
        if (stageIdx === -1) return ch;
        const stages = ch.stages.map((st, i) => {
          if (i === stageIdx) return { ...st, cleared: true };
          if (i === stageIdx + 1) return { ...st, unlocked: true };
          return st;
        });
        return { ...ch, stages };
      });

      return {
        ...s, inventory: inv, chapters,
        dailyMissions: updateMissions(s.dailyMissions),
        weeklyMissions: updateMissions(s.weeklyMissions),
        easyCompleted: newEasy,
        hardCompleted: newHard,
      };
    });
    return allRewards;
  }, []);

  const useExpCard = useCallback((type: 'basic_exp' | 'advanced_exp', count: number) => {
    // Call backend
    api.useExpCards(type, count).then(profile => {
      const inv = profile.inventory as unknown as Record<string, number>;
      setState(s => ({
        ...s,
        level: profile.level,
        exp: profile.exp,
        inventory: {
          basic_exp: inv['basicExp'] ?? inv['basic_exp'] ?? 0,
          advanced_exp: inv['advancedExp'] ?? inv['advanced_exp'] ?? 0,
          promotion_ticket: inv['promotionTicket'] ?? inv['promotion_ticket'] ?? 0,
        },
      }));
    }).catch(err => console.error('useExpCard failed:', err));
  }, []);

  const promote = useCallback((): boolean => {
    let success = false;
    api.promote().then(profile => {
      const inv = profile.inventory as unknown as Record<string, number>;
      setState(s => ({
        ...s,
        elite: profile.elite,
        level: profile.level,
        inventory: {
          basic_exp: inv['basicExp'] ?? inv['basic_exp'] ?? 0,
          advanced_exp: inv['advancedExp'] ?? inv['advanced_exp'] ?? 0,
          promotion_ticket: inv['promotionTicket'] ?? inv['promotion_ticket'] ?? 0,
        },
      }));
      success = true;
    }).catch(err => console.error('promote failed:', err));
    return success;
  }, []);

  const claimMission = useCallback((id: string, type: 'daily' | 'weekly'): RewardItem[] | null => {
    let rewards: RewardItem[] | null = null;
    api.claimMission(id).then(r => {
      if (r.length > 0) {
        rewards = r;
        // Refresh profile to update inventory
        refreshProfile();
        // Update mission claimed status
        setState(s => {
          const key = type === 'daily' ? 'dailyMissions' : 'weeklyMissions';
          const missions = s[key].map(m =>
            m.id === id ? { ...m, claimed: true } : m
          );
          return { ...s, [key]: missions };
        });
      }
    }).catch(err => console.error('claimMission failed:', err));
    return rewards;
  }, [refreshProfile]);

  const toggleSetting = useCallback((key: 'sound' | 'animation') => {
    setState(s => ({ ...s, settings: { ...s.settings, [key]: !s.settings[key] } }));
  }, []);

  return (
    <GameContext.Provider value={{
      ...state, maxLevel, competencies, setCurrentChapter, completeChallenge,
      useExpCard, promote, claimMission, toggleSetting,
      refreshChapters, refreshMissions, refreshProfile,
    }}>
      {children}
    </GameContext.Provider>
  );
}
