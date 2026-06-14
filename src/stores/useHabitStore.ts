import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Habit, HabitLog } from '@/types/index.ts';
import { subDays, format } from 'date-fns';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: string) => void;
  getLogsForDate: (date: string) => HabitLog[];
  getCompletionRate: (habitId: string, days: number) => number;
  setHabitsAndLogs: (habits: Habit[], logs: HabitLog[]) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      addHabit: (habit) =>
        set((s) => ({
          habits: [
            ...s.habits,
            { ...habit, id: nanoid(), createdAt: new Date().toISOString(), archived: false },
          ],
        })),
      updateHabit: (id, updates) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        })),
      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          logs: s.logs.filter((l) => l.habitId !== id),
        })),
      toggleHabitLog: (habitId, date) =>
        set((s) => {
          const existing = s.logs.find((l) => l.habitId === habitId && l.date === date);
          if (existing) {
            return {
              logs: s.logs.map((l) =>
                l.id === existing.id
                  ? { ...l, completed: !l.completed, count: l.completed ? 0 : 1 }
                  : l
              ),
            };
          }
          return {
            logs: [
              ...s.logs,
              { id: nanoid(), habitId, date, completed: true, count: 1 },
            ],
          };
        }),
      getLogsForDate: (date) => {
        return get().logs.filter((l) => l.date === date);
      },
      getCompletionRate: (habitId, days) => {
        const today = new Date();
        const logs = get().logs;
        let completed = 0;
        for (let i = 0; i < days; i++) {
          const d = format(subDays(today, i), 'yyyy-MM-dd');
          const log = logs.find((l) => l.habitId === habitId && l.date === d);
          if (log?.completed) completed++;
        }
        return days === 0 ? 0 : Math.round((completed / days) * 100);
      },
      setHabitsAndLogs: (habits, logs) => set({ habits, logs }),
    }),
    { name: 'hn-habits' }
  )
);
