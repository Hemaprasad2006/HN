import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, parseISO, startOfDay, format } from 'date-fns';

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

// Premium initial states
const defaultHabits: Habit[] = [
  { id: 'h1', name: 'Morning Meditation', icon: '🧘', color: '#8B5CF6', frequency: 'daily', targetCount: 1, archived: false },
  { id: 'h2', name: 'Drink 3L Water', icon: '💧', color: '#3B82F6', frequency: 'daily', targetCount: 1, archived: false },
  { id: 'h3', name: 'Read 10 Pages', icon: '📖', color: '#F59E0B', frequency: 'daily', targetCount: 1, archived: false }
];

const defaultLogs: HabitLog[] = [
  { id: 'l1', habitId: 'h1', date: format(new Date(), 'yyyy-MM-dd'), completed: true, count: 1, createdAt: new Date().toISOString() },
  { id: 'l2', habitId: 'h1', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), completed: true, count: 1, createdAt: new Date().toISOString() },
  { id: 'l3', habitId: 'h1', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), completed: true, count: 1, createdAt: new Date().toISOString() },
  { id: 'l4', habitId: 'h2', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), completed: true, count: 1, createdAt: new Date().toISOString() }
];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: defaultHabits,
      logs: defaultLogs,
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
          const dStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
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
      name: 'lifeos-mobile-habits-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
