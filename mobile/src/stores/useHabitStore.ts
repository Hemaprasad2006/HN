import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, parseISO, startOfDay } from 'date-fns';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  count: number;
  createdAt: string;
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habit: Omit<Habit, 'id' | 'archived'>) => void;
  toggleHabitLog: (habitId: string, date: string) => void;
  getCompletionRate: (habitId: string, daysLookback: number) => number;
  setHabits: (habits: Habit[]) => void;
  setLogs: (logs: HabitLog[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      addHabit: (habit) =>
        set((s) => ({
          habits: [...s.habits, { ...habit, id: generateId(), archived: false }],
        })),
      toggleHabitLog: (habitId, date) =>
        set((s) => {
          const existingIdx = s.logs.findIndex((l) => l.habitId === habitId && l.date === date);
          if (existingIdx > -1) {
            const updated = [...s.logs];
            const wasCompleted = updated[existingIdx].completed;
            updated[existingIdx] = {
              ...updated[existingIdx],
              completed: !wasCompleted,
            };
            return { logs: updated };
          } else {
            return {
              logs: [
                ...s.logs,
                {
                  id: generateId(),
                  habitId,
                  date,
                  completed: true,
                  count: 1,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
          }
        }),
      getCompletionRate: (habitId, daysLookback) => {
        const logs = get().logs.filter((l) => l.habitId === habitId && l.completed);
        const dates = new Set(logs.map((l) => l.date));
        
        let completedDays = 0;
        for (let i = 0; i < daysLookback; i++) {
          const dStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (dates.has(dStr)) {
            completedDays++;
          }
        }
        return Math.round((completedDays / daysLookback) * 100);
      },
      setHabits: (habits) => set({ habits }),
      setLogs: (logs) => set({ logs }),
    }),
    {
      name: 'lifeos-mobile-habits',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
