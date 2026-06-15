import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { format, subDays } from 'date-fns';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { getGreeting, getDateKey, formatDuration, percentage, getLevel, getLevelProgress, cn } from '@/utils/helpers.ts';
import { motivationalQuotes } from '@/data/constants.ts';
import { CheckCircle2, Circle, Droplets, Timer, Flame, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

function getDailyQuote() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return motivationalQuotes[seed % motivationalQuotes.length];
}

export function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = getDateKey(today);

  const profile = useSettingsStore((s) => s.profile);
  const tasks = usePlannerStore((s) => s.tasks);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const habits = useHabitStore((s) => s.habits);
  const getLogsForDate = useHabitStore((s) => s.getLogsForDate);
  const toggleHabitLog = useHabitStore((s) => s.toggleHabitLog);
  const getTotalHours = useStudyStore((s) => s.getTotalHours);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const addWater = useHealthStore((s) => s.addWater);
  const xp = useGameStore((s) => s.totalXP);
  const getTodayFocusMinutes = useFocusStore((s) => s.getTodayFocusMinutes);

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayKey), [tasks, todayKey]);
  const completedTasks = todayTasks.filter((t) => t.status === 'done').length;
  const todayHabitLogs = useMemo(() => getLogsForDate(todayKey), [getLogsForDate, todayKey]);
  const completedHabits = todayHabitLogs.filter((l) => l.completed).length;
  const weekStudyHours = useMemo(() => getTotalHours(7), [getTotalHours]);
  const todayFocusMin = useMemo(() => getTodayFocusMinutes(), [getTodayFocusMinutes]);
  const todayHealth = healthLogs.find((l) => l.date === todayKey);
  const waterPct = todayHealth ? Math.min(100, Math.round((todayHealth.waterIntake / (profile.targetWater || 3000)) * 100)) : 0;

  const lifeScore = useMemo(() => {
    const taskScore = todayTasks.length > 0 ? (completedTasks / todayTasks.length) * 25 : 25;
    const habitScore = habits.length > 0 ? (completedHabits / habits.length) * 25 : 25;
    const waterScore = waterPct * 0.25;
    const focusScore = Math.min(25, (todayFocusMin / 120) * 25);
    return Math.round(taskScore + habitScore + waterScore + focusScore);
  }, [completedTasks, todayTasks.length, completedHabits, habits.length, waterPct, todayFocusMin]);

  const nextTask = useMemo(() => todayTasks.find((t) => t.status !== 'done'), [todayTasks]);
  const quote = useMemo(() => getDailyQuote(), []);
  const greeting = getGreeting();
  const hour = new Date().getHours();
  const timeContext = hour < 12 ? 'Plan your day' : hour < 17 ? 'Time to execute' : 'Reflect & recharge';

  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (lifeScore / 100) * circ;
  const scoreColor = lifeScore > 70 ? '#10b981' : lifeScore > 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {format(today, 'EEEE, MMM d')} · {timeContext}
          </p>
          <h1 className="mt-1 font-extrabold leading-tight" style={{ fontSize: 'clamp(20px, 6vw, 28px)', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {greeting}, {profile.name || 'Hemaprasad'} 👋
          </h1>
        </div>
        <div className="life-score-ring shrink-0 ml-3">
          <svg width="64" height="64" viewBox="0 0 100 100">
            <circle className="progress-ring-track" cx="50" cy="50" r={radius} strokeWidth="10" />
            <circle className="progress-ring-fill" cx="50" cy="50" r={radius} strokeWidth="10"
              stroke={scoreColor} strokeDasharray={circ} strokeDashoffset={dashOffset} />
          </svg>
          <div className="life-score-value">
            <p className="font-extrabold text-center" style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1 }}>{lifeScore}</p>
            <p style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center' }}>SCORE</p>
          </div>
        </div>
      </div>

      {nextTask ? (
        <button onClick={() => navigate('/planner')} className="mission-card w-full text-left group">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <p className="text-2xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#a5b4fc' }}>TODAY'S MISSION</p>
              <p className="font-bold leading-snug" style={{ fontSize: 'clamp(14px, 4vw, 17px)', color: '#f0f2ff' }}>{nextTask.title}</p>
              {nextTask.estimatedMinutes > 0 && (
                <p className="mt-1 text-[11px] font-medium" style={{ color: '#8892b0' }}>
                  ⏱ {formatDuration(nextTask.estimatedMinutes)} · {nextTask.priority} priority
                </p>
              )}
            </div>
            <ArrowRight className="w-5 h-5 mt-1 shrink-0 ml-3 transition-transform group-hover:translate-x-1" style={{ color: '#818cf8' }} />
          </div>
          {todayTasks.length > 0 && (
            <div className="mt-4 relative z-10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: '#8892b0' }}>{completedTasks}/{todayTasks.length} tasks done</span>
                <span className="text-[10px] font-bold" style={{ color: '#a5b4fc' }}>{percentage(completedTasks, todayTasks.length)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage(completedTasks, todayTasks.length)}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
              </div>
            </div>
          )}
        </button>
      ) : (
        <div className="mission-card w-full text-center py-6">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold" style={{ color: '#a5b4fc', fontSize: 15 }}>All tasks complete!</p>
          <p className="text-xs mt-1" style={{ color: '#8892b0' }}>Outstanding work today.</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Tasks', value: `${completedTasks}/${todayTasks.length}`, icon: <CheckCircle2 className="w-4 h-4" />, color: '#6366f1', glow: 'stat-glow-indigo' },
          { label: 'Habits', value: `${completedHabits}/${habits.length}`, icon: <Flame className="w-4 h-4" />, color: '#f59e0b', glow: 'stat-glow-amber' },
          { label: 'Focus', value: todayFocusMin > 0 ? `${todayFocusMin}m` : '—', icon: <Timer className="w-4 h-4" />, color: '#8b5cf6', glow: 'stat-glow-violet' },
          { label: 'Study', value: `${Math.round(weekStudyHours * 10) / 10}h`, icon: <BookOpen className="w-4 h-4" />, color: '#10b981', glow: 'stat-glow-emerald' },
        ].map((stat, i) => (
          <div key={i} className={`glass-card stat-card animate-slide-in-up ${stat.glow}`} style={{ animationDelay: `${i * 60}ms` }}>
            <div style={{ color: stat.color }}>{stat.icon}</div>
            <p className="stat-card-value">{stat.value}</p>
            <p className="stat-card-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="insight-card">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#10b981' }} />
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-widest mb-1" style={{ color: '#10b981' }}>AI INSIGHT</p>
            <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              {lifeScore >= 75
                ? `You're crushing it, ${profile.name?.split(' ')[0] || 'Hemaprasad'}! Keep this momentum going.`
                : completedHabits === 0 && habits.length > 0
                ? 'Start with one habit to build momentum — small wins compound into big results.'
                : nextTask
                ? `Focus on "${nextTask.title}" next. Completing it will boost your score.`
                : `Great week! You've studied ${Math.round(weekStudyHours * 10) / 10}h — keep the streak going.`
              }
            </p>
          </div>
        </div>
      </div>

      {habits.filter((h) => !h.archived).length > 0 && (
        <div>
          <div className="section-title">
            <span>Habits Today</span>
            <button onClick={() => navigate('/habits')} className="text-[10px] font-semibold" style={{ color: '#818cf8' }}>All →</button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {habits.filter((h) => !h.archived).slice(0, 8).map((habit) => {
              const log = todayHabitLogs.find((l) => l.habitId === habit.id);
              const done = log?.completed ?? false;
              return (
                <button key={habit.id} onClick={() => toggleHabitLog(habit.id, todayKey)} className={`habit-pill shrink-0 ${done ? 'completed' : ''}`}>
                  <div className="habit-pill-icon" style={{ background: done ? `${habit.color}25` : 'rgba(255,255,255,0.04)' }}>
                    {done ? '✓' : (habit.icon || '⭐')}
                  </div>
                  <span className="habit-pill-name">{habit.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {todayTasks.length > 0 && (
        <div>
          <div className="section-title">
            <span>Today's Tasks</span>
            <button onClick={() => navigate('/planner')} className="text-[10px] font-semibold" style={{ color: '#818cf8' }}>Planner →</button>
          </div>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map((task, i) => {
              const done = task.status === 'done';
              return (
                <button key={task.id} onClick={() => toggleTask(task.id)}
                  className={cn('w-full glass-card p-3 flex items-center gap-3 text-left animate-slide-in-up',
                    task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low')}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="shrink-0">
                    {done ? <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} /> : <Circle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', done && 'line-through opacity-50')} style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                    {task.estimatedMinutes > 0 && !done && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDuration(task.estimatedMinutes)}</p>}
                  </div>
                </button>
              );
            })}
            {todayTasks.length > 5 && <button onClick={() => navigate('/planner')} className="w-full text-center py-2 text-xs font-semibold" style={{ color: '#818cf8' }}>+{todayTasks.length - 5} more →</button>}
          </div>
        </div>
      )}

      <div>
        <div className="section-title">Hydration</div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" style={{ color: '#06b6d4' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{((todayHealth?.waterIntake || 0) / 1000).toFixed(1)}L / {((profile.targetWater || 3000) / 1000).toFixed(1)}L</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#06b6d4' }}>{waterPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${waterPct}%`, background: 'linear-gradient(90deg,#06b6d4,#0284c7)' }} />
          </div>
          <div className="flex gap-2">
            {[250, 500, 750].map((ml) => (
              <button key={ml} onClick={() => addWater(ml)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>+{ml}ml</button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <p className="text-xs leading-relaxed font-medium italic" style={{ color: 'var(--text-secondary)' }}>"{quote.text}"</p>
        <p className="text-[10px] mt-2 font-bold" style={{ color: 'var(--text-muted)' }}>— {quote.author}</p>
      </div>
    </div>
  );
}
