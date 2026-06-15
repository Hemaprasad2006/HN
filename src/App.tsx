import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Layout } from '@/components/layout/Layout.tsx';
import { Dashboard } from '@/features/dashboard/Dashboard.tsx';
import { Goals } from '@/features/goals/Goals.tsx';
import { Planner } from '@/features/planner/Planner.tsx';
import { Habits } from '@/features/habits/Habits.tsx';
import { Study } from '@/features/study/Study.tsx';
import { Focus } from '@/features/focus/Focus.tsx';
import { Health } from '@/features/health/Health.tsx';
import { Journal } from '@/features/journal/Journal.tsx';
import { Gamification } from '@/features/gamification/Gamification.tsx';
import { WeeklyReviews } from '@/features/reviews/WeeklyReviews.tsx';
import { AICoach } from '@/features/coach/AICoach.tsx';
import { AdvancedAnalytics } from '@/features/analytics/AdvancedAnalytics.tsx';
import { Settings } from '@/features/settings/Settings.tsx';
import { Life } from '@/features/life/Life.tsx';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { Auth } from '@/features/auth/Auth.tsx';
import { useState } from 'react';
import { useGoalStore } from '@/stores/useGoalStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useJournalStore } from '@/stores/useJournalStore.ts';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { useEffect } from 'react';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestMode = useAuthStore((s) => s.guestMode);
  const setGuestMode = useAuthStore((s) => s.setGuestMode);
  const initialize = useAuthStore((s) => s.initialize);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsReady(true);
    };
    init();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated || !isReady) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const sync = () => {
      useAuthStore.getState().syncLocalToBackend();
    };

    const triggerSync = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(sync, 2000); // Debounce 2 seconds
    };

    const unsubPlanner = usePlannerStore.subscribe(triggerSync);
    const unsubGoal = useGoalStore.subscribe(triggerSync);
    const unsubHabit = useHabitStore.subscribe(triggerSync);
    const unsubStudy = useStudyStore.subscribe(triggerSync);
    const unsubHealth = useHealthStore.subscribe(triggerSync);
    const unsubJournal = useJournalStore.subscribe(triggerSync);
    const unsubFocus = useFocusStore.subscribe(triggerSync);
    const unsubGame = useGameStore.subscribe(triggerSync);

    return () => {
      unsubPlanner();
      unsubGoal();
      unsubHabit();
      unsubStudy();
      unsubHealth();
      unsubJournal();
      unsubFocus();
      unsubGame();
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isReady]);

  if (!isAuthenticated && !guestMode) {
    return (
      <Auth
        onSuccess={() => {}}
        onGuestMode={() => setGuestMode(true)}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/study" element={<Study />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/health" element={<Health />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/achievements" element={<Gamification />} />
          <Route path="/reviews" element={<WeeklyReviews />} />
          <Route path="/coach" element={<AICoach />} />
          <Route path="/analytics" element={<AdvancedAnalytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/life" element={<Life />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
