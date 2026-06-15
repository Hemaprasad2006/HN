import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'studies' | 'work' | 'health' | 'personal' | 'finance';
  targetDate: string;
  milestones: Milestone[];
  progress: number;
  archived: boolean;
  createdAt: string;
}

interface GoalState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'archived' | 'progress'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  archiveGoal: (id: string) => void;
  setGoals: (goals: Goal[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const calcProgress = (milestones: Milestone[]) => {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.completed).length;
  return Math.round((done / milestones.length) * 100);
};

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (goal) =>
        set((s) => ({
          goals: [
            ...s.goals,
            {
              ...goal,
              id: generateId(),
              createdAt: new Date().toISOString(),
              archived: false,
              progress: calcProgress(goal.milestones),
            },
          ],
        })),
      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const updated = { ...g, ...updates };
            updated.progress = calcProgress(updated.milestones);
            return updated;
          }),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            );
            return { ...g, milestones, progress: calcProgress(milestones) };
          }),
        })),
      archiveGoal: (id) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, archived: true } : g)),
        })),
      setGoals: (goals) => set({ goals }),
    }),
    {
      name: 'lifeos-mobile-goals',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
