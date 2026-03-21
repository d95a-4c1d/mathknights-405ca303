import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CHAPTERS, DAILY_MISSIONS, WEEKLY_MISSIONS, expToNextLevel, type Chapter, type Mission, type RewardItem, type Problem } from '@/data/mockData';

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
}

interface GameContextType extends GameState {
  setCurrentChapter: (id: string | null) => void;
  completeChallenge: (problem: Problem) => RewardItem[];
  useExpCard: (type: 'basic_exp' | 'advanced_exp', count: number) => void;
  promote: () => boolean;
  claimMission: (id: string, type: 'daily' | 'weekly') => RewardItem[] | null;
  toggleSetting: (key: 'sound' | 'animation') => void;
  maxLevel: number;
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
    level: 26,
    exp: 4038,
    inventory: { basic_exp: 213, advanced_exp: 1056, promotion_ticket: 17 },
    chapters: JSON.parse(JSON.stringify(CHAPTERS)),
    dailyMissions: JSON.parse(JSON.stringify(DAILY_MISSIONS)),
    weeklyMissions: JSON.parse(JSON.stringify(WEEKLY_MISSIONS)),
    currentChapter: null,
    settings: { sound: true, animation: true },
    easyCompleted: 0,
    hardCompleted: 0,
  });

  const maxLevel = state.elite === 0 ? 50 : 70;

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
          // Simple problems
          if (isEasy && (desc.includes('简单题') || desc.includes('错题') || desc.includes('公式')))
            return { ...m, current: Math.min(m.current + 1, m.target) };
          // Hard problems
          if (!isEasy && desc.includes('困难题'))
            return { ...m, current: Math.min(m.current + 1, m.target) };
          // Generic "complete" missions
          if (desc.includes('完成') && !desc.includes('简单') && !desc.includes('困难'))
            return { ...m, current: Math.min(m.current + 1, m.target) };
          return m;
        });

      // Mark stage cleared and unlock next
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
    setState(s => {
      const available = type === 'basic_exp' ? s.inventory.basic_exp : s.inventory.advanced_exp;
      const use = Math.min(count, available);
      if (use <= 0) return s;
      const expGain = type === 'basic_exp' ? use * 100 : use * 500;
      let newExp = s.exp + expGain;
      let newLevel = s.level;
      const ml = s.elite === 0 ? 50 : 70;
      while (newLevel < ml && newExp >= expToNextLevel(newLevel)) {
        newExp -= expToNextLevel(newLevel);
        newLevel++;
      }
      if (newLevel >= ml) { newLevel = ml; }
      const inv = { ...s.inventory };
      if (type === 'basic_exp') inv.basic_exp -= use;
      else inv.advanced_exp -= use;
      return { ...s, exp: newExp, level: newLevel, inventory: inv };
    });
  }, []);

  const promote = useCallback((): boolean => {
    let success = false;
    setState(s => {
      if (s.elite >= 1) return s;
      if (s.level < 50) return s;
      if (s.inventory.promotion_ticket < 20) return s;
      success = true;
      return {
        ...s, elite: 1, level: 50,
        inventory: { ...s.inventory, promotion_ticket: s.inventory.promotion_ticket - 20 },
      };
    });
    return success;
  }, []);

  const claimMission = useCallback((id: string, type: 'daily' | 'weekly'): RewardItem[] | null => {
    let rewards: RewardItem[] | null = null;
    setState(s => {
      const key = type === 'daily' ? 'dailyMissions' : 'weeklyMissions';
      const missions = s[key].map(m => {
        if (m.id === id && m.current >= m.target && !m.claimed) {
          rewards = m.rewards;
          return { ...m, claimed: true };
        }
        return m;
      });
      if (!rewards) return s;
      const inv = { ...s.inventory };
      rewards.forEach((r: RewardItem) => {
        if (r.type === 'basic_exp') inv.basic_exp += r.quantity;
        if (r.type === 'advanced_exp') inv.advanced_exp += r.quantity;
        if (r.type === 'promotion_ticket') inv.promotion_ticket += r.quantity;
      });
      return { ...s, [key]: missions, inventory: inv };
    });
    return rewards;
  }, []);

  const toggleSetting = useCallback((key: 'sound' | 'animation') => {
    setState(s => ({ ...s, settings: { ...s.settings, [key]: !s.settings[key] } }));
  }, []);

  return (
    <GameContext.Provider value={{
      ...state, maxLevel, setCurrentChapter, completeChallenge,
      useExpCard, promote, claimMission, toggleSetting,
    }}>
      {children}
    </GameContext.Provider>
  );
}
