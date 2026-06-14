import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { FocusSession } from '@/types/index.ts';
import { subDays, parseISO, startOfDay, format } from 'date-fns';

interface FocusState {
  sessions: FocusSession[];
  addSession: (session: Omit<FocusSession, 'id' | 'createdAt'>) => void;
  updateSession: (id: string, updates: Partial<FocusSession>) => void;
  getTodayFocusMinutes: () => number;
  getWeeklyFocusMinutes: () => number;
  setSessions: (sessions: FocusSession[]) => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (session) =>
        set((s) => ({
          sessions: [
            ...s.sessions,
            { ...session, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateSession: (id, updates) =>
        set((s) => ({
          sessions: s.sessions.map((ses) => (ses.id === id ? { ...ses, ...updates } : ses)),
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
    { name: 'lifeos-focus' }
  )
);
