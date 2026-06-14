import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types/index.ts';

interface SettingsState {
  theme: 'dark' | 'light';
  profile: UserProfile;
  toggleTheme: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      profile: {
        name: 'User',
        dailyFocus: '',
        targetWater: 3000,
        targetSleep: 8,
        targetStudyHours: 4,
        pomodoroWork: 25,
        pomodoroBreak: 5,
        pomodoroLongBreak: 15,
        geminiApiKey: '',
        openaiApiKey: '',
        useModel: 'gemini',
        notificationsEnabled: false,
        reminderIntervalMinutes: 30,
      },
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      updateProfile: (updates) => set((s) => ({ profile: { ...s.profile, ...updates } })),
    }),
    { name: 'lifeos-settings' }
  )
);
