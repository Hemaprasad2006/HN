import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Task } from '@/types/index.ts';
import { format, addDays } from 'date-fns';

interface PlannerState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  moveToTomorrow: (id: string) => void;
  getTasksForDate: (date: string) => Task[];
  setTasks: (tasks: Task[]) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...task, id: nanoid(), createdAt: new Date().toISOString(), status: 'todo' },
          ],
        })),
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const isDone = t.status === 'done';
            return {
              ...t,
              status: isDone ? 'todo' as const : 'done' as const,
              completedAt: isDone ? undefined : new Date().toISOString(),
            };
          }),
        })),
      moveToTomorrow: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const tomorrow = format(addDays(new Date(t.dueDate), 1), 'yyyy-MM-dd');
            return { ...t, dueDate: tomorrow };
          }),
        })),
      getTasksForDate: (date) => {
        return get().tasks.filter((t) => t.dueDate === date);
      },
      setTasks: (tasks) => set({ tasks }),
    }),
    { name: 'hn-planner' }
  )
);
