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
      totalXP: 4200,
      xpHistory: [
        {
          id: 'xp1',
          type: 'focus',
          amount: 1200,
          description: 'Deep Work milestone: 10 total hours',
          timestamp: new Date().toISOString()
        },
        {
          id: 'xp2',
          type: 'task',
          amount: 1500,
          description: 'Finished all weekly goals on time',
          timestamp: new Date().toISOString()
        },
        {
          id: 'xp3',
          type: 'habit',
          amount: 1500,
          description: 'Morning Meditation streak (14 days)',
          timestamp: new Date().toISOString()
        }
      ],
      unlockedAchievements: ['first_session', 'habit_streak_7', 'golden_week'],

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
      name: 'lifeos-mobile-game-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
