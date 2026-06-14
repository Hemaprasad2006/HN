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
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { Auth } from '@/features/auth/Auth.tsx';
import { useEffect } from 'react';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestMode = useAuthStore((s) => s.guestMode);
  const setGuestMode = useAuthStore((s) => s.setGuestMode);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
