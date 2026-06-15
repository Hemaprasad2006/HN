import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, parseISO, startOfDay } from 'date-fns';

export interface FocusSession {
  id: string;
  type: 'pomodoro' | 'custom';
  durationMinutes: number;
  breakMinutes: number;
  startTime: string;
  completed: boolean;
  createdAt: string;
}

interface FocusState {
  sessions: FocusSession[];
  isFocusRunning: boolean;
  setIsFocusRunning: (val: boolean) => void;
  focusTaskName: string;
  setFocusTaskName: (name: string) => void;
  addSession: (session: Omit<FocusSession, 'id' | 'createdAt'>) => void;
  getTodayFocusMinutes: () => number;
  getWeeklyFocusMinutes: () => number;
  setSessions: (sessions: FocusSession[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      isFocusRunning: false,
      setIsFocusRunning: (val) => set({ isFocusRunning: val }),
      focusTaskName: 'Deep Work',
      setFocusTaskName: (name) => set({ focusTaskName: name }),
      addSession: (session) =>
        set((s) => ({
          sessions: [
            ...s.sessions,
            { ...session, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),
      getTodayFocusMinutes: () => {
        const today = startOfDay(new Date());
        return get()
          .sessions.filter((s) => s.completed && parseISO(s.startTime) >= today)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },
      getWeeklyFocusMinutes: () => {
        const weekAgo = subDays(new Date(), 7);
        return get()
          .sessions.filter((s) => s.completed && parseISO(s.startTime) >= weekAgo)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },
      setSessions: (sessions) => set({ sessions }),
    }),
    {
      name: 'lifeos-mobile-focus',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
