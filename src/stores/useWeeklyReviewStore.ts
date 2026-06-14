import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeeklyReview } from '@/types/index.ts';

interface WeeklyReviewState {
  reviews: WeeklyReview[];
  saveWeeklyReview: (review: WeeklyReview) => void;
  deleteWeeklyReview: (id: string) => void;
  setReviews: (reviews: WeeklyReview[]) => void;
}

export const useWeeklyReviewStore = create<WeeklyReviewState>()(
  persist(
    (set) => ({
      reviews: [],
      saveWeeklyReview: (review) =>
        set((s) => {
          const filtered = s.reviews.filter(
            (r) => !(r.year === review.year && r.weekNumber === review.weekNumber)
          );
          return { reviews: [...filtered, review].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
        }),
      deleteWeeklyReview: (id) =>
        set((s) => ({
          reviews: s.reviews.filter((r) => r.id !== id),
        })),
      setReviews: (reviews) => set({ reviews }),
    }),
    { name: 'hn-weekly-reviews' }
  )
);
