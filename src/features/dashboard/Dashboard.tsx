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

// ──────────────────────────────────────────────
// Daily quote — seeded by date so it changes once per day
// ──────────────────────────────────────────────
function getDailyQuote() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return motivationalQuotes[seed % motivationalQuotes.length];
}

// ──────────────────────────────────────────────
// Custom dark chart tooltip
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = getDateKey(today);

  /* ── Store data ── */
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
  const totalXP = useGameStore((s) => s.totalXP);

  /* ── Computed: today ── */
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === todayKey),
    [tasks, todayKey],
  );
  const tasksCompleted = todayTasks.filter((t) => t.status === 'done').length;

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const habitsCompleted = useMemo(
    () => habitLogs.filter((l) => l.date === todayKey && l.completed).length,
    [habitLogs, todayKey],
  );

  const todayStudyMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.startTime.startsWith(todayKey))
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions, todayKey],
  );
  const todayStudyHours = Math.round((todayStudyMinutes / 60) * 10) / 10;

  const todayHealthLog = useMemo(
    () => healthLogs.find((l) => l.date === todayKey),
    [healthLogs, todayKey],
  );
  const waterIntake = todayHealthLog?.waterIntake ?? 0;
  const sleepHours = todayHealthLog?.sleepHours ?? 0;

  const workedOut = useMemo(
    () => exerciseLogs.some((l) => l.date === todayKey),
    [exerciseLogs, todayKey],
  );

  /* ── Overall progress ── */
  const overallProgress = useMemo(() => {
    const taskPct = todayTasks.length > 0 ? percentage(tasksCompleted, todayTasks.length) : 0;
    const habitPct = activeHabits.length > 0 ? percentage(habitsCompleted, activeHabits.length) : 0;
    const studyPct =
      profile.targetStudyHours > 0
        ? Math.min(100, percentage(todayStudyMinutes, profile.targetStudyHours * 60))
        : 0;
    const buckets = [
      todayTasks.length > 0,
      activeHabits.length > 0,
      profile.targetStudyHours > 0,
    ].filter(Boolean).length;
    return buckets > 0 ? Math.round((taskPct + habitPct + studyPct) / buckets) : 0;
  }, [tasksCompleted, todayTasks, habitsCompleted, activeHabits, todayStudyMinutes, profile.targetStudyHours]);

  /* ── Quote ── */
  const dailyQuote = useMemo(() => getDailyQuote(), []);

  /* ── Weekly habit chart ── */
  const habitChartData = useMemo(() => {
    const totalActive = activeHabits.length || 1;
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const key = getDateKey(day);
      const completed = habitLogs.filter((l) => l.date === key && l.completed).length;
      return { day: format(day, 'EEE'), Completion: Math.round((completed / totalActive) * 100) };
    });
  }, [habitLogs, activeHabits, today]);

  /* ── Weekly study chart ── */
  const studyChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const key = getDateKey(day);
      const mins = sessions
        .filter((s) => s.startTime.startsWith(key))
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return { day: format(day, 'EEE'), Hours: Math.round((mins / 60) * 10) / 10 };
    });
  }, [sessions, today]);

  /* ── Active goals ── */
  const activeGoals = useMemo(() => goals.filter((g) => !g.archived).slice(0, 4), [goals]);

  /* ── Water action ── */
  const handleAddWater = () => {
    addWater(250);
  };

  /* ── Stat card config ── */
  const statCards = [
    { label: 'Tasks Done', value: `${tasksCompleted}/${todayTasks.length}`, icon: CheckCircle2, color: 'indigo', textColor: 'text-indigo-400', bgAccent: 'bg-indigo-500/10' },
    { label: 'Habits', value: `${habitsCompleted}/${activeHabits.length}`, icon: Repeat, color: 'emerald', textColor: 'text-emerald-400', bgAccent: 'bg-emerald-500/10' },
    { label: 'Study Hours', value: `${todayStudyHours}h`, icon: BookOpen, color: 'violet', textColor: 'text-violet-400', bgAccent: 'bg-violet-500/10' },
    { label: 'Water', value: `${waterIntake}/${profile.targetWater}ml`, icon: Droplets, color: 'cyan', textColor: 'text-cyan-400', bgAccent: 'bg-cyan-500/10' },
    { label: 'Sleep', value: `${sleepHours}h`, icon: Moon, color: 'amber', textColor: 'text-amber-400', bgAccent: 'bg-amber-500/10' },
    { label: 'Workout', value: workedOut ? 'Done ✓' : 'Not Yet', icon: Dumbbell, color: 'rose', textColor: 'text-rose-400', bgAccent: 'bg-rose-500/10' },
  ];

  const priorityDot: Record<string, string> = {
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  };

  const CIRCUMFERENCE = 2 * Math.PI * 52;

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-screen space-y-6 p-6 lg:p-8">

      {/* ═══════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="glass-card animate-fade-in relative overflow-hidden p-6 lg:p-8">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="space-y-3">
            <h1 className="gradient-text text-3xl font-bold tracking-tight lg:text-4xl">
              {getGreeting()}, {profile.name}
            </h1>

            <p className="flex items-center text-sm text-gray-400">
              <Clock className="mr-1.5 h-4 w-4 -translate-y-px" />
              {format(today, 'EEEE, MMMM d, yyyy')}
            </p>

            {/* Quote */}
            <div className="flex max-w-lg items-start gap-2 rounded-xl bg-white/5 p-3">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-sm italic leading-relaxed text-gray-300">
                  &ldquo;{dailyQuote.text}&rdquo;
                </p>
                <p className="mt-1 text-xs text-gray-500">&mdash; {dailyQuote.author}</p>
              </div>
            </div>

            {/* Daily focus */}
            {profile.dailyFocus && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-medium text-gray-300">Focus:</span>
                <span className="text-sm text-gray-400">{profile.dailyFocus}</span>
              </div>
            )}
          </div>

          {/* Right — progress ring */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#progressGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
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
                <p className="gradient-text text-3xl font-bold">{overallProgress}%</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Today</p>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-400">Overall Progress</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. STATS CARDS
          ═══════════════════════════════════════════ */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const delayClass = [
            'animation-delay-100',
            'animation-delay-200',
            'animation-delay-300',
            'animation-delay-400',
            'animation-delay-500',
            'animation-delay-500',
          ][i];
          return (
            <div
              key={card.label}
              className={cn(
                'glass-card animate-fade-in p-4',
                `stat-glow-${card.color}`,
                delayClass,
              )}
              style={{ opacity: 0 }}
            >
              <div className={cn('mb-3 inline-flex rounded-lg p-2', card.bgAccent)}>
                <Icon className={cn('h-5 w-5', card.textColor)} />
              </div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className={cn('mt-1 text-lg font-bold', card.textColor)}>{card.value}</p>
            </div>
          );
        })}
      </section>

      {/* ═══════════════════════════════════════════
          3. QUICK ACTIONS
          ═══════════════════════════════════════════ */}
      <section className="animate-fade-in animation-delay-300" style={{ opacity: 0 }}>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Add Task', icon: Plus, gradient: 'from-indigo-500 to-violet-500', shadow: 'shadow-indigo-500/20 hover:shadow-indigo-500/30', hoverFx: 'group-hover:rotate-90', onClick: () => navigate('/planner') },
            { label: 'Start Focus', icon: Crosshair, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20 hover:shadow-violet-500/30', hoverFx: 'group-hover:rotate-45', onClick: () => navigate('/focus') },
            { label: 'Log Water (+250ml)', icon: Droplets, gradient: 'from-cyan-500 to-teal-500', shadow: 'shadow-cyan-500/20 hover:shadow-cyan-500/30', hoverFx: 'group-hover:scale-110', onClick: handleAddWater },
            { label: 'Quick Journal', icon: PenLine, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20 hover:shadow-amber-500/30', hoverFx: 'group-hover:-rotate-12', onClick: () => navigate('/journal') },
          ].map((btn) => {
            const BtnIcon = btn.icon;
            return (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={cn(
                  'group flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95',
                  btn.gradient,
                  btn.shadow,
                )}
              >
                <BtnIcon className={cn('h-4 w-4 transition-transform', btn.hoverFx)} />
                {btn.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. MINI CHARTS
          ═══════════════════════════════════════════ */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Habit Trend */}
        <div className="glass-card animate-fade-in animation-delay-400 p-5" style={{ opacity: 0 }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-1.5">
              <Repeat className="h-4 w-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Weekly Habit Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={habitChartData} barSize={24}>
              <defs>
                <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Completion" fill="url(#habitGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Study Hours */}
        <div className="glass-card animate-fade-in animation-delay-500 p-5" style={{ opacity: 0 }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-violet-500/10 p-1.5">
              <BookOpen className="h-4 w-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Study Hours This Week</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={studyChartData}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Hours" stroke="#8b5cf6" strokeWidth={2} fill="url(#studyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5 & 6. TODAY'S TASKS + ACTIVE GOALS
          ═══════════════════════════════════════════ */}
      <section className="grid gap-6 lg:grid-cols-2">

        {/* ── Today's Tasks ── */}
        <div className="glass-card animate-fade-in animation-delay-400 p-5" style={{ opacity: 0 }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-500/10 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-200">Today&apos;s Tasks</h3>
            </div>
            <Link to="/planner" className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">No tasks scheduled for today</p>
              <button onClick={() => navigate('/planner')} className="mt-2 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                Plan your day →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/5',
                    task.status === 'done' && 'opacity-50',
                  )}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      task.status === 'done'
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-600 hover:border-indigo-400',
                    )}
                  >
                    {task.status === 'done' && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>

                  <span className={cn('h-2 w-2 shrink-0 rounded-full', priorityDot[task.priority] ?? 'bg-gray-500')} />

                  <span className={cn('flex-1 truncate text-sm', task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200')}>
                    {task.title}
                  </span>

                  {task.estimatedMinutes > 0 && (
                    <span className="shrink-0 text-xs text-gray-500">{formatDuration(task.estimatedMinutes)}</span>
                  )}
                </div>
              ))}
              {todayTasks.length > 5 && (
                <p className="pt-1 text-center text-xs text-gray-500">+{todayTasks.length - 5} more tasks</p>
              )}
            </div>
          )}
        </div>

        {/* ── Active Goals ── */}
        <div className="glass-card animate-fade-in animation-delay-500 p-5" style={{ opacity: 0 }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-1.5">
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-200">Active Goals</h3>
            </div>
            <Link to="/goals" className="flex items-center gap-1 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activeGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">No active goals yet</p>
              <button onClick={() => navigate('/goals')} className="mt-2 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300">
                Set your first goal →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const catConfig = goalCategoryConfig[goal.category];
                const daysLeft = Math.max(
                  0,
                  Math.ceil((new Date(goal.deadline).getTime() - today.getTime()) / 86_400_000),
                );
                return (
                  <div key={goal.id} className="group rounded-xl px-3 py-3 transition-all hover:bg-white/5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{catConfig?.icon ?? '🎯'}</span>
                        <span className="line-clamp-1 text-sm font-medium text-gray-200">{goal.title}</span>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          daysLeft <= 7
                            ? 'bg-rose-500/15 text-rose-400'
                            : daysLeft <= 30
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-400',
                        )}
                      >
                        {daysLeft}d left
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="progress-bar-fill h-full rounded-full transition-all"
                        style={{ width: `${goal.progress}%`, background: catConfig?.color ?? '#6366f1' }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-gray-500">{goal.progress}% complete</p>
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
