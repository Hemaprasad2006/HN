import { create } from 'zustand';
import { apiRequest } from '@/utils/api.ts';
import { useGoalStore } from './useGoalStore.ts';
import { usePlannerStore } from './usePlannerStore.ts';
import { useHabitStore } from './useHabitStore.ts';
import { useStudyStore } from './useStudyStore.ts';
import { useHealthStore } from './useHealthStore.ts';
import { useJournalStore } from './useJournalStore.ts';
import { useWeeklyReviewStore } from './useWeeklyReviewStore.ts';
import { useGameStore } from './useGameStore.ts';
import { useSettingsStore } from './useSettingsStore.ts';
import { useFocusStore } from './useFocusStore.ts';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  guestMode: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  syncLocalToBackend: () => Promise<void>;
  setGuestMode: (guest: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: localStorage.getItem('hn-auth-token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('hn-auth-token'),
  guestMode: false,
  loading: false,
  error: null,
  setGuestMode: (guest) => set({ guestMode: guest }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('hn-auth-token', data.token);
      set({ token: data.token, user: data.profile, isAuthenticated: true, loading: false });
      
      // Pull all data from backend
      await get().initialize();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      localStorage.setItem('hn-auth-token', data.token);
      set({ token: data.token, user: data.profile, isAuthenticated: true, loading: false });
      
      // Push any offline data
      await get().syncLocalToBackend();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('hn-auth-token');
    set({ token: null, user: null, isAuthenticated: false });
    
    // Clear stores
    useGoalStore.getState().setGoals([]);
    usePlannerStore.getState().setTasks([]);
    useHabitStore.getState().setHabitsAndLogs([], []);
    useStudyStore.getState().setSubjectsAndSessions([], []);
    useHealthStore.getState().setHealthAndExercise([], []);
    useJournalStore.getState().setEntries([]);
    useWeeklyReviewStore.getState().setReviews([]);
    useGameStore.getState().setXPAndAchievements([], []);
    useFocusStore.getState().setSessions([]);
  },

  initialize: async () => {
    const token = localStorage.getItem('hn-auth-token');
    if (!token) return;

    try {
      const profile = await apiRequest('/auth/profile');
      set({ user: profile, isAuthenticated: true });

      // Pull all backend records
      const data = await apiRequest('/sync/pull-all-data');
      
      useGoalStore.getState().setGoals(data.goals || []);
      usePlannerStore.getState().setTasks(data.tasks || []);
      useHabitStore.getState().setHabitsAndLogs(data.habits || [], data.habitLogs || []);
      useStudyStore.getState().setSubjectsAndSessions(data.subjects || [], data.studySessions || []);
      useHealthStore.getState().setHealthAndExercise(data.healthLogs || [], data.exerciseLogs || []);
      useJournalStore.getState().setEntries(data.journalEntries || []);
      useWeeklyReviewStore.getState().setReviews(data.weeklyReviews || []);
      useGameStore.getState().setXPAndAchievements(data.xpEvents || [], data.achievements || []);
      useFocusStore.getState().setSessions(data.focusSessions || []);

      // Load profile updates into settings store
      useSettingsStore.getState().updateProfile(profile);
    } catch (err) {
      console.error('Failed to initialize sync with backend:', err);
    }
  },

  syncLocalToBackend: async () => {
    if (!get().isAuthenticated) return;
    try {
      const goals = useGoalStore.getState().goals;
      const tasks = usePlannerStore.getState().tasks;
      const habits = useHabitStore.getState().habits;
      const habitLogs = useHabitStore.getState().logs;
      const subjects = useStudyStore.getState().subjects;
      const studySessions = useStudyStore.getState().sessions;
      const focusSessions = useFocusStore.getState().sessions;
      const healthLogs = useHealthStore.getState().healthLogs;
      const exerciseLogs = useHealthStore.getState().exerciseLogs;
      const journalEntries = useJournalStore.getState().entries;
      const weeklyReviews = useWeeklyReviewStore.getState().reviews;
      
      const totalXP = useGameStore.getState().totalXP;
      const unlockedAchievements = useGameStore.getState().unlockedAchievements;
      
      const payload = {
        goals,
        tasks,
        habits,
        habitLogs,
        subjects,
        studySessions,
        focusSessions,
        healthLogs,
        exerciseLogs,
        journalEntries,
        weeklyReviews,
        achievements: unlockedAchievements.map(id => ({ id: Math.random().toString(36).substring(2, 9), achievementId: id, unlockedAt: new Date().toISOString() })),
        xpEvents: [{ id: 'init-sync-xp', type: 'system', amount: totalXP, description: 'Initial sync points migration', timestamp: new Date().toISOString() }],
      };

      await apiRequest('/sync/push-offline-data', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('Successfully synced local data to backend server database.');
    } catch (err) {
      console.error('Failed to sync offline data to backend database:', err);
    }
  },
}));
