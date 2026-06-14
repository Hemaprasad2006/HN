import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { JournalEntry } from '@/types/index.ts';

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntryForDate: (date: string) => JournalEntry | undefined;
  setEntries: (entries: JournalEntry[]) => void;
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [
            ...s.entries,
            { ...entry, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateEntry: (id, updates) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      getEntryForDate: (date) => {
        return get().entries.find((e) => e.date === date);
      },
      setEntries: (entries) => set({ entries }),
    }),
    { name: 'hn-journal' }
  )
);
