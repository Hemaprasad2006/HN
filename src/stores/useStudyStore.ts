import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Subject, StudySession } from '@/types/index.ts';
import { subDays, format, parseISO } from 'date-fns';

interface StudyState {
  subjects: Subject[];
  sessions: StudySession[];
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addSession: (session: Omit<StudySession, 'id' | 'createdAt'>) => void;
  deleteSession: (id: string) => void;
  getTotalHours: (days?: number) => number;
  getSubjectHours: (subjectId: string, days?: number) => number;
  setSubjectsAndSessions: (subjects: Subject[], sessions: StudySession[]) => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      subjects: [],
      sessions: [],
      addSubject: (subject) =>
        set((s) => ({
          subjects: [
            ...s.subjects,
            { ...subject, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      updateSubject: (id, updates) =>
        set((s) => ({
          subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)),
        })),
      deleteSubject: (id) =>
        set((s) => ({
          subjects: s.subjects.filter((sub) => sub.id !== id),
          sessions: s.sessions.filter((ses) => ses.subjectId !== id),
        })),
      addSession: (session) =>
        set((s) => ({
          sessions: [
            ...s.sessions,
            { ...session, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((ses) => ses.id !== id) })),
      getTotalHours: (days) => {
        const sessions = get().sessions;
        if (!days) {
          return sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
        }
        const cutoff = subDays(new Date(), days);
        return (
          sessions
            .filter((s) => parseISO(s.startTime) >= cutoff)
            .reduce((sum, s) => sum + s.durationMinutes, 0) / 60
        );
      },
      getSubjectHours: (subjectId, days) => {
        const sessions = get().sessions.filter((s) => s.subjectId === subjectId);
        if (!days) {
          return sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
        }
        const cutoff = subDays(new Date(), days);
        return (
          sessions
            .filter((s) => parseISO(s.startTime) >= cutoff)
            .reduce((sum, s) => sum + s.durationMinutes, 0) / 60
        );
      },
      setSubjectsAndSessions: (subjects, sessions) => set({ subjects, sessions }),
    }),
    { name: 'lifeos-study' }
  )
);
