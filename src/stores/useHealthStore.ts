import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { HealthLog, ExerciseLog } from '@/types/index.ts';
import { format } from 'date-fns';

interface HealthState {
  healthLogs: HealthLog[];
  exerciseLogs: ExerciseLog[];
  addHealthLog: (log: Omit<HealthLog, 'id' | 'createdAt'>) => void;
  updateHealthLog: (id: string, updates: Partial<HealthLog>) => void;
  addExerciseLog: (log: Omit<ExerciseLog, 'id' | 'createdAt'>) => void;
  getLogForDate: (date: string) => HealthLog | undefined;
  addWater: (amount: number, date?: string) => void;
  deleteExerciseLog: (id: string) => void;
  setHealthAndExercise: (healthLogs: HealthLog[], exerciseLogs: ExerciseLog[]) => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      healthLogs: [],
      exerciseLogs: [],
      addHealthLog: (log) =>
        set((s) => ({
          healthLogs: [
            ...s.healthLogs,
            { ...log, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateHealthLog: (id, updates) =>
        set((s) => ({
          healthLogs: s.healthLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
      addExerciseLog: (log) =>
        set((s) => ({
          exerciseLogs: [
            ...s.exerciseLogs,
            { ...log, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      deleteExerciseLog: (id) =>
        set((s) => ({ exerciseLogs: s.exerciseLogs.filter((l) => l.id !== id) })),
      getLogForDate: (date) => {
        return get().healthLogs.find((l) => l.date === date);
      },
      addWater: (amount, date) => {
        const d = date || format(new Date(), 'yyyy-MM-dd');
        set((s) => {
          const existing = s.healthLogs.find((l) => l.date === d);
          if (existing) {
            return {
              healthLogs: s.healthLogs.map((l) =>
                l.id === existing.id
                  ? { ...l, waterIntake: l.waterIntake + amount }
                  : l
              ),
            };
          }
          return {
            healthLogs: [
              ...s.healthLogs,
              {
                id: nanoid(),
                date: d,
                waterIntake: amount,
                sleepHours: 0,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },
      setHealthAndExercise: (healthLogs, exerciseLogs) => set({ healthLogs, exerciseLogs }),
    }),
    { name: 'lifeos-health' }
  )
);
