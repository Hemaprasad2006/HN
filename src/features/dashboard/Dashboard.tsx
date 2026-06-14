import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  Repeat,
  BookOpen,
  Droplets,
  Moon,
  Dumbbell,
  Plus,
  Crosshair,
  PenLine,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  Trophy,
  Quote,
} from 'lucide-react';

import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useGoalStore } from '@/stores/useGoalStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { getGreeting, getDateKey, formatDuration, percentage, cn } from '@/utils/helpers.ts';
import { motivationalQuotes, goalCategoryConfig } from '@/data/constants.ts';

function getDailyQuote() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return motivationalQuotes[seed % motivationalQuotes.length];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-1 font-medium text-gray-300">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value}
          {entry.name === 'Completion' ? '%' : 'h'}
        </p>
      ))}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = getDateKey(today);

  const profile = useSettingsStore((s) => s.profile);
  const tasks = usePlannerStore((s) => s.tasks);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const sessions = useStudyStore((s) => s.sessions);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const exerciseLogs = useHealthStore((s) => s.exerciseLogs);
  const addWater = useHealthStore((s) => s.addWater);
  const goals = useGoalStore((s) => s.goals);

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayKey), [tasks, todayKey]);
  const tasksCompleted = todayTasks.filter((t) => t.status === 'done').length;

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const habitsCompleted = useMemo(
    () => habitLogs.filter((l) => l.date === todayKey && l.completed).length,
    [habitLogs, todayKey],
  );

  const todayStudyMinutes = useMemo(
    () => sessions.filter((s) => s.startTime.startsWith(todayKey)).reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions, todayKey],
  );
  const todayStudyHours = Math.round((todayStudyMinutes / 60) * 10) / 10;

  const todayHealthLog = useMemo(() => healthLogs.find((l) => l.date === todayKey), [healthLogs, todayKey]);
  const waterIntake = todayHealthLog?.waterIntake ?? 0;
  const sleepHours = todayHealthLog?.sleepHours ?? 0;

  const workedOut = useMemo(() => exerciseLogs.some((l) => l.date === todayKey), [exerciseLogs, todayKey]);

  const overallProgress = useMemo(() => {
    const taskPct = todayTasks.length > 0 ? percentage(tasksCompleted, todayTasks.length) : 0;
    const habitPct = activeHabits.length > 0 ? percentage(habitsCompleted, activeHabits.length) : 0;
    const studyPct = profile.targetStudyHours > 0 ? Math.min(100, percentage(todayStudyMinutes, profile.targetStudyHours * 60)) : 0;
    const buckets = [todayTasks.length > 0, activeHabits.length > 0, profile.targetStudyHours > 0].filter(Boolean).length;
    return buckets > 0 ? Math.round((taskPct + habitPct + studyPct) / buckets) : 0;
  }, [tasksCompleted, todayTasks, habitsCompleted, activeHabits, todayStudyMinutes, profile.targetStudyHours]);

  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const habitChartData = useMemo(() => {
    const totalActive = activeHabits.length || 1;
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const key = getDateKey(day);
      const completed = habitLogs.filter((l) => l.date === key && l.completed).length;
      return { day: format(day, 'EEE'), Completion: Math.round((completed / totalActive) * 100) };
    });
  }, [habitLogs, activeHabits, today]);

  const studyChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const key = getDateKey(day);
      const mins = sessions.filter((s) => s.startTime.startsWith(key)).reduce((sum, s) => sum + s.durationMinutes, 0);
      return { day: format(day, 'EEE'), Hours: Math.round((mins / 60) * 10) / 10 };
    });
  }, [sessions, today]);

  const activeGoals = useMemo(() => goals.filter((g) => !g.archived).slice(0, 4), [goals]);

  const statCards = [
    { label: 'Tasks', value: `${tasksCompleted}/${todayTasks.length}`, icon: CheckCircle2, textColor: 'text-indigo-400', bgAccent: 'bg-indigo-500/10', glow: 'stat-glow-indigo' },
    { label: 'Habits', value: `${habitsCompleted}/${activeHabits.length}`, icon: Repeat, textColor: 'text-emerald-400', bgAccent: 'bg-emerald-500/10', glow: 'stat-glow-emerald' },
    { label: 'Study', value: `${todayStudyHours}h`, icon: BookOpen, textColor: 'text-violet-400', bgAccent: 'bg-violet-500/10', glow: 'stat-glow-violet' },
    { label: 'Water', value: `${waterIntake}ml`, icon: Droplets, textColor: 'text-cyan-400', bgAccent: 'bg-cyan-500/10', glow: 'stat-glow-cyan' },
    { label: 'Sleep', value: `${sleepHours}h`, icon: Moon, textColor: 'text-amber-400', bgAccent: 'bg-amber-500/10', glow: 'stat-glow-amber' },
    { label: 'Workout', value: workedOut ? '✓ Done' : 'Pending', icon: Dumbbell, textColor: 'text-rose-400', bgAccent: 'bg-rose-500/10', glow: 'stat-glow-rose' },
  ];

  const priorityDot: Record<string, string> = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
  const CIRCUMFERENCE = 2 * Math.PI * 52;

  return (
    <div className="space-y-4 md:space-y-6 pb-2">

      {/* ── 1. HERO ── */}
      <section className="glass-card animate-fade-in relative overflow-hidden p-4 md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div className="space-y-2 min-w-0">
            <h1 className="gradient-text text-2xl md:text-3xl font-bold tracking-tight truncate">
              {getGreeting()}, {profile.name || 'User'} 👋
            </h1>

            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {format(today, 'EEEE, MMMM d')}
            </p>

            {/* Quote */}
            <div className="flex items-start gap-2 rounded-xl bg-white/[0.04] p-3 max-w-md">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs italic leading-relaxed text-gray-300 line-clamp-2">
                  &ldquo;{dailyQuote.text}&rdquo;
                </p>
                <p className="mt-1 text-[10px] text-gray-500">&mdash; {dailyQuote.author}</p>
              </div>
            </div>

            {profile.dailyFocus && (
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                <span className="text-xs font-medium text-gray-300">Focus:</span>
                <span className="text-xs text-gray-400 truncate">{profile.dailyFocus}</span>
              </div>
            )}
          </div>

          {/* Progress ring — smaller on mobile */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 self-center">
            <div className="relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="url(#progressGrad)"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(overallProgress / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative z-10 text-center">
                <p className="gradient-text text-2xl md:text-3xl font-bold">{overallProgress}%</p>
                <p className="text-[9px] uppercase tracking-widest text-gray-500">Today</p>
              </div>
            </div>
            <p className="text-[11px] font-medium text-gray-400">Overall Progress</p>
          </div>
        </div>
      </section>

      {/* ── 2. STAT CARDS ── */}
      <section className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn('glass-card animate-fade-in p-3 md:p-4', card.glow)}
              style={{ opacity: 0, animationDelay: `${i * 80}ms` }}
            >
              <div className={cn('mb-2 inline-flex rounded-lg p-1.5 md:p-2', card.bgAccent)}>
                <Icon className={cn('h-3.5 w-3.5 md:h-4 md:w-4', card.textColor)} />
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 leading-tight">{card.label}</p>
              <p className={cn('mt-0.5 text-sm md:text-base font-bold leading-tight', card.textColor)}>{card.value}</p>
            </div>
          );
        })}
      </section>

      {/* ── 3. QUICK ACTIONS ── */}
      <section className="animate-fade-in animation-delay-300" style={{ opacity: 0 }}>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {[
            { label: 'Add Task', icon: Plus, gradient: 'from-indigo-500 to-violet-500', onClick: () => navigate('/planner') },
            { label: 'Start Focus', icon: Crosshair, gradient: 'from-violet-500 to-purple-600', onClick: () => navigate('/focus') },
            { label: '+250ml Water', icon: Droplets, gradient: 'from-cyan-500 to-teal-500', onClick: () => addWater(250) },
            { label: 'Quick Journal', icon: PenLine, gradient: 'from-amber-500 to-orange-500', onClick: () => navigate('/journal') },
          ].map((btn) => {
            const BtnIcon = btn.icon;
            return (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 sm:w-auto',
                  btn.gradient,
                )}
              >
                <BtnIcon className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                {btn.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. CHARTS ── */}
      <section className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <div className="glass-card animate-fade-in animation-delay-400 p-4 md:p-5" style={{ opacity: 0 }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-1.5">
              <Repeat className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <h3 className="text-xs md:text-sm font-semibold text-gray-200">Weekly Habit Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={habitChartData} barSize={20}>
              <defs>
                <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={32} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Completion" fill="url(#habitGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card animate-fade-in animation-delay-500 p-4 md:p-5" style={{ opacity: 0 }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-violet-500/10 p-1.5">
              <BookOpen className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <h3 className="text-xs md:text-sm font-semibold text-gray-200">Study Hours This Week</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={studyChartData}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickFormatter={(v) => `${v}h`} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Hours" stroke="#8b5cf6" strokeWidth={2} fill="url(#studyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── 5 & 6. TASKS + GOALS ── */}
      <section className="grid gap-4 md:gap-6 lg:grid-cols-2">

        {/* Today's Tasks */}
        <div className="glass-card animate-fade-in animation-delay-400 p-4 md:p-5" style={{ opacity: 0 }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-500/10 p-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-200">Today&apos;s Tasks</h3>
            </div>
            <Link to="/planner" className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Sparkles className="mb-2 h-6 w-6 text-gray-600" />
              <p className="text-xs text-gray-500">No tasks for today</p>
              <button onClick={() => navigate('/planner')} className="mt-2 text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
                Plan your day →
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className={cn('flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all hover:bg-white/[0.04]', task.status === 'done' && 'opacity-50')}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      task.status === 'done' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600 hover:border-indigo-400',
                    )}
                  >
                    {task.status === 'done' && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                  </button>

                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priorityDot[task.priority] ?? 'bg-gray-500')} />

                  <span className={cn('flex-1 truncate text-xs md:text-sm', task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200')}>
                    {task.title}
                  </span>

                  {task.estimatedMinutes > 0 && (
                    <span className="shrink-0 text-[10px] text-gray-500">{formatDuration(task.estimatedMinutes)}</span>
                  )}
                </div>
              ))}
              {todayTasks.length > 5 && (
                <p className="pt-1 text-center text-[10px] text-gray-500">+{todayTasks.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="glass-card animate-fade-in animation-delay-500 p-4 md:p-5" style={{ opacity: 0 }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-gray-200">Active Goals</h3>
            </div>
            <Link to="/goals" className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activeGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Target className="mb-2 h-6 w-6 text-gray-600" />
              <p className="text-xs text-gray-500">No active goals yet</p>
              <button onClick={() => navigate('/goals')} className="mt-2 text-[11px] font-medium text-amber-400 hover:text-amber-300">
                Set your first goal →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeGoals.map((goal) => {
                const catConfig = goalCategoryConfig[goal.category];
                const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - today.getTime()) / 86_400_000));
                return (
                  <div key={goal.id} className="rounded-xl px-2.5 py-2.5 transition-all hover:bg-white/[0.04]">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{catConfig?.icon ?? '🎯'}</span>
                        <span className="truncate text-xs md:text-sm font-medium text-gray-200">{goal.title}</span>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                          daysLeft <= 7 ? 'bg-rose-500/15 text-rose-400' : daysLeft <= 30 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400',
                        )}
                      >
                        {daysLeft}d
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="progress-bar-fill h-full rounded-full"
                        style={{ width: `${goal.progress}%`, background: catConfig?.color ?? '#6366f1' }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-gray-500">{goal.progress}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
