import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'studies' | 'work' | 'health' | 'personal' | 'routine';
  dueDate: string;
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'done';
  completedAt?: string;
  createdAt: string;
}

interface PlannerState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  moveToTomorrow: (id: string) => void;
  setTasks: (tasks: Task[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

// Premium initial states
const defaultTasks = (): Task[] => [
  {
    id: 't1',
    title: 'Finish DSA revision',
    description: 'Solve 3 tree problems & review graphs',
    category: 'studies',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    estimatedMinutes: 45,
    priority: 'high',
    status: 'todo',
    createdAt: new Date().toISOString()
  },
  {
    id: 't2',
    title: 'Complete mobile app design review',
    description: 'Iterate layouts based on senior product feedback',
    category: 'work',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    estimatedMinutes: 30,
    priority: 'medium',
    status: 'todo',
    createdAt: new Date().toISOString()
  },
  {
    id: 't3',
    title: 'Evening run & stretching',
    description: '3km zone 2 run and full-body stretch',
    category: 'health',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    estimatedMinutes: 20,
    priority: 'low',
    status: 'todo',
    createdAt: new Date().toISOString()
  },
  {
    id: 't4',
    title: 'Write project launch post',
    description: 'Draft announcements for the mobile companion app launch',
    category: 'work',
    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    estimatedMinutes: 25,
    priority: 'medium',
    status: 'todo',
    createdAt: new Date().toISOString()
  }
];

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      tasks: defaultTasks(),
      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...task, id: generateId(), createdAt: new Date().toISOString(), status: 'todo' },
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
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'lifeos-mobile-planner-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

