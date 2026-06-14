import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { XPEvent } from '@/types/index.ts';

interface GameState {
  totalXP: number;
  xpHistory: XPEvent[];
  unlockedAchievements: string[];
  addXP: (amount: number, type: string, description: string) => void;
  unlockAchievement: (achievementId: string) => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  setXPAndAchievements: (xpHistory: XPEvent[], achievements: any[]) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      xpHistory: [],
      unlockedAchievements: [],

      addXP: (amount, type, description) =>
        set((state) => ({
          totalXP: state.totalXP + amount,
          xpHistory: [
            ...state.xpHistory,
            {
              id: nanoid(),
              type,
              amount,
              description,
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      unlockAchievement: (achievementId) =>
        set((state) => {
          if (state.unlockedAchievements.includes(achievementId)) return state;
          return {
            unlockedAchievements: [...state.unlockedAchievements, achievementId],
          };
        }),

      isAchievementUnlocked: (achievementId) => {
        return get().unlockedAchievements.includes(achievementId);
      },

      setXPAndAchievements: (xpHistory, achievements) =>
        set({
          xpHistory,
          unlockedAchievements: achievements.map((a: any) => a.achievementId),
          totalXP: xpHistory.reduce((sum, e) => sum + e.amount, 0),
        }),
    }),
    { name: 'lifeos-game' }
  )
);
