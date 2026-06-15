import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useGoalStore } from '@/stores/useGoalStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { getLevel, getLevelProgress, getLevelTitle, calculateStreak } from '@/utils/helpers.ts';
import { Target, Trophy, PenLine, Settings, LogOut, Star, BookOpen, Zap, Moon, Sun, Flame, CheckSquare, Award } from 'lucide-react';
import { goalCategoryConfig } from '@/data/constants.ts';

export function Life() {
  const navigate = useNavigate();
  const goals = useGoalStore((s) => s.goals);
  const totalXP = useGameStore((s) => s.totalXP);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const { profile, theme, toggleTheme } = useSettingsStore();
  const { logout } = useAuthStore();

  const tasks = usePlannerStore((s) => s.tasks);
  const { habits, logs: habitLogs } = useHabitStore();
  const { sessions: focusSessions } = useFocusStore();

  const level = getLevel(totalXP);
  const levelPct = getLevelProgress(totalXP);
  const levelTitle = getLevelTitle(level);
  const activeGoals = goals.filter((g) => !g.archived).slice(0, 3);
  const unlockedCount = unlockedAchievements.length;

  // Compute completed tasks count
  const completedTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'done').length;
  }, [tasks]);

  // Compute best habit streak
  const bestStreak = useMemo(() => {
    let max = 0;
    habits.forEach((h) => {
      const dates = habitLogs.filter((l) => l.habitId === h.id && l.completed).map((l) => l.date);
      const streak = calculateStreak(dates);
      if (streak.longest > max) max = streak.longest;
    });
    return max;
  }, [habits, habitLogs]);

  // Compute focus session stats
  const totalFocusMinutes = useMemo(() => {
    return focusSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [focusSessions]);

  const totalFocusSessions = useMemo(() => {
    return focusSessions.filter((s) => s.completed).length;
  }, [focusSessions]);

  const quickLinks = [
    { label: 'All Goals', icon: Target, to: '/goals', color: '#8B5CF6' },
    { label: 'Achievements', icon: Trophy, to: '/achievements', color: '#F59E0B' },
    { label: 'Full Journal', icon: PenLine, to: '/journal', color: '#22C55E' },
    { label: 'Health Hub', icon: BookOpen, to: '/health', color: '#EF4444' },
    { label: 'AI Coach', icon: Zap, to: '/coach', color: '#8B5CF6' },
    { label: 'Settings', icon: Settings, to: '/settings', color: '#64748B' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-8" style={{ paddingBottom: '24px' }}>
      
      {/* Header and Theme Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-white font-extrabold">Life</h1>
          <p className="text-secondary-text text-gray-400 mt-1">Identity progression, values, and journey logs</p>
        </div>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 active:scale-90 transition-transform">
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4 text-[#8B5CF6]" />}
        </button>
      </div>

      {/* Identity: Who you are becoming */}
      <div className="glass-card p-6 bg-[#121826] border border-white/5 flex flex-col gap-2">
        <p className="text-label text-violet-400 font-extrabold uppercase tracking-widest">Who You Are Becoming</p>
        <blockquote className="text-card-title text-white font-extrabold italic mt-1 leading-relaxed">
          "I am designing a life of absolute clarity, relentless focus, and deep physical vitality."
        </blockquote>
        <p className="text-secondary-text text-gray-500 mt-2 font-medium">
          {profile.name || 'Hemaprasad'} · Personal Growth Profile
        </p>
      </div>

      {/* Gamification Level Status Card */}
      <div className="glass-card p-5 bg-[#121826] border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label text-gray-400 font-bold uppercase tracking-wider">Identity Rank</p>
            <p className="text-card-title text-white font-black mt-0.5">Level {level} · {levelTitle}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/10 text-violet-400 flex items-center justify-center">
            <Star className="w-5 h-5 fill-current animate-breathe" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] transition-all duration-500" style={{ width: `${levelPct}%` }} />
          </div>
          <span className="text-label font-bold text-[#8B5CF6]">{levelPct}%</span>
        </div>

        <div className="flex gap-8 text-left border-t border-white/5 pt-4">
          <div>
            <p className="text-body font-black text-white">{totalXP.toLocaleString()}</p>
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider mt-0.5">Accumulated XP</p>
          </div>
          <div>
            <p className="text-body font-black text-[#F59E0B]">{unlockedCount}</p>
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider mt-0.5">Achievements</p>
          </div>
          <div>
            <p className="text-body font-black text-emerald-400">{completedTasksCount}</p>
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider mt-0.5">Completed Tasks</p>
          </div>
        </div>
      </div>

      {/* Core Guiding Values */}
      <div className="flex flex-col gap-3">
        <h2 className="text-section-title text-white font-extrabold px-1">Guiding Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Focus First', desc: 'Protect attention. Keep work deep and single-minded, rejecting distractions.', emoji: '🧠' },
            { title: 'Daily Consistency', desc: 'Nurture habits. Keep plants hydrated daily and sustain streaks.', emoji: '🌿' },
            { title: 'Full Vitality', desc: 'Stay energized. Sleep consistently, hydrate well, and exercise.', emoji: '⚡' },
            { title: 'Continuous Progress', desc: 'Step by step. Master new skills, complete missions, and level up.', emoji: '📈' },
          ].map((val, idx) => (
            <div key={idx} className="glass-card p-5 bg-[#121826] border border-white/5 flex gap-4">
              <span className="text-3xl shrink-0 mt-0.5">{val.emoji}</span>
              <div>
                <h4 className="text-card-title text-white font-extrabold">{val.title}</h4>
                <p className="text-secondary-text text-gray-400 mt-1 leading-relaxed">{val.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Life Journey Milestones list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-section-title text-white font-extrabold px-1">Journey Logs</h2>
        <div className="glass-card p-5 bg-[#121826] border border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-secondary-text text-gray-300">
            <Flame className="w-5 h-5 text-amber-500" />
            <span className="text-body font-bold">Longest consistency streak: <strong className="text-white font-black">{bestStreak} days</strong></span>
          </div>
          <div className="flex items-center gap-3 text-secondary-text text-gray-300">
            <Zap className="w-5 h-5 text-violet-400" />
            <span className="text-body font-bold">Deep Focus sessions completed: <strong className="text-white font-black">{totalFocusSessions} sessions</strong> ({totalFocusMinutes} mins)</span>
          </div>
          <div className="flex items-center gap-3 text-secondary-text text-gray-300">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <span className="text-body font-bold">Missions executed: <strong className="text-white font-black">{completedTasksCount} goals/tasks</strong></span>
          </div>
          <div className="flex items-center gap-3 text-secondary-text text-gray-300">
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="text-body font-bold">Current identity rating: <strong className="text-white font-black">{levelTitle} (Level {level})</strong></span>
          </div>
        </div>
      </div>

      {/* Active Goal Checklist */}
      {activeGoals.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-section-title text-white font-extrabold">Active Goals</h2>
            <button onClick={() => navigate('/goals')} className="text-violet-400 text-label font-bold uppercase tracking-wider">See all</button>
          </div>
          <div className="flex flex-col gap-3">
            {activeGoals.map((g) => {
              const cfg = goalCategoryConfig[g.category];
              return (
                <button key={g.id} onClick={() => navigate('/goals')} 
                  className="w-full glass-card p-4 flex items-center gap-4 text-left bg-[#121826] border border-white/5 active:scale-[0.99] transition-transform">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg?.color || '#8B5CF6'}15` }}>
                    <span className="text-lg">{cfg?.icon || '🎯'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-bold text-white truncate">{g.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                        <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: cfg?.color || '#8B5CF6' }} />
                      </div>
                      <span className="text-label font-bold shrink-0" style={{ color: cfg?.color || '#8B5CF6' }}>{g.progress}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Quick Links Grid */}
      <div className="flex flex-col gap-3">
        <h2 className="text-section-title text-white font-extrabold px-1">Shortcuts</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button key={link.label} onClick={() => navigate(link.to)} 
              className="glass-card p-4 flex flex-col items-center justify-center gap-3 text-center bg-[#121826] hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${link.color}10` }}>
                <link.icon className="w-5 h-5" style={{ color: link.color }} />
              </div>
              <span className="text-label text-gray-300 font-bold leading-tight truncate w-full">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out Button */}
      <button onClick={() => { if (confirm('Are you sure you want to sign out?')) logout(); }} 
        className="w-full glass-card p-4.5 flex items-center justify-between bg-[#121826] border border-white/5 hover:border-red-500/20 active:scale-[0.99] transition-all text-left">
        <span className="text-body font-extrabold text-red-500">Sign Out</span>
        <LogOut className="w-4.5 h-4.5 text-red-500" />
      </button>

    </div>
  );
}

