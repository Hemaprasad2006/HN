import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface XPEvent {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

interface GameState {
  totalXP: number;
  xpHistory: XPEvent[];
  unlockedAchievements: string[];
  addXP: (amount: number, type: string, description: string) => void;
  unlockAchievement: (achievementId: string) => void;
  isAchievementUnlocked: (achievementId: string) => boolean;
  setXPAndAchievements: (xpHistory: XPEvent[], achievements: any[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

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
              id: generateId(),
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
    {
      name: 'lifeos-mobile-game',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
