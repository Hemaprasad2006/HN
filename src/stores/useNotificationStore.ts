import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { ReminderAlert } from '@/types/index.ts';

interface NotificationState {
  alerts: ReminderAlert[];
  inbox: { id: string; title: string; message: string; timestamp: string; read: boolean }[];
  addAlert: (alert: Omit<ReminderAlert, 'id'>) => void;
  toggleAlert: (id: string) => void;
  deleteAlert: (id: string) => void;
  updateAlertTime: (id: string, time: string) => void;
  addNotification: (title: string, message: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const defaultAlerts: ReminderAlert[] = [
  { id: '1', time: '09:00', type: 'habit', label: 'Morning Habits Check', enabled: true },
  { id: '2', time: '12:00', type: 'water', label: 'Hydration Check-in', enabled: true },
  { id: '3', time: '15:00', type: 'water', label: 'Hydration Check-in', enabled: true },
  { id: '4', time: '18:00', type: 'study', label: 'Time to Study', enabled: true },
  { id: '5', time: '21:00', type: 'planner', label: 'Evening Reflection & Tasks', enabled: true },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      alerts: defaultAlerts,
      inbox: [],
      addAlert: (alert) =>
        set((s) => ({
          alerts: [...s.alerts, { ...alert, id: nanoid() }],
        })),
      toggleAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        })),
      deleteAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.filter((a) => a.id !== id),
        })),
      updateAlertTime: (id, time) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, time } : a)),
        })),
      addNotification: (title, message) =>
        set((s) => ({
          inbox: [
            {
              id: nanoid(),
              title,
              message,
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...s.inbox,
          ].slice(0, 50),
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          inbox: s.inbox.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      clearNotifications: () => set({ inbox: [] }),
    }),
    { name: 'hn-notifications' }
  )
);
