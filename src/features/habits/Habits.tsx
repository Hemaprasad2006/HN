import { useState, useMemo } from 'react';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { subjectColors } from '@/data/constants.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { getDateKey, calculateStreak, percentage, cn } from '@/utils/helpers.ts';
import { format, subDays } from 'date-fns';
import { Repeat, Plus, Flame, TrendingUp, Award, CheckCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HabitFrequency } from '@/types/index.ts';

const emojiOptions = ['🌅', '🏋️', '💧', '🧘', '📖', '💻', '📵', '📝', '🏃', '🍎', '💪', '🎯', '🧠', '✍️', '😴', '🚀'];

export function Habits() {
  const { habits, logs, addHabit, toggleHabitLog, getCompletionRate } = useHabitStore();
  const addXP = useGameStore((s) => s.addXP);
  const [showModal, setShowModal] = useState(false);
  const today = getDateKey();

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(subjectColors[0]);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetCount, setTargetCount] = useState(1);

  const activeHabits = habits.filter((h) => !h.archived);
  const todayLogs = logs.filter((l) => l.date === today);
  const completedToday = todayLogs.filter((l) => l.completed).length;

  // Calculate streaks for each habit
  const habitStreaks = useMemo(() => {
    const map: Record<string, { current: number; longest: number }> = {};
    activeHabits.forEach((h) => {
      const dates = logs.filter((l) => l.habitId === h.id && l.completed).map((l) => l.date);
      map[h.id] = calculateStreak(dates);
    });
    return map;
  }, [activeHabits, logs]);

  const bestStreak = useMemo(() => {
    return Math.max(0, ...Object.values(habitStreaks).map((s) => s.longest));
  }, [habitStreaks]);

  const avgRate = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    const total = activeHabits.reduce((s, h) => s + getCompletionRate(h.id, 30), 0);
    return Math.round(total / activeHabits.length);
  }, [activeHabits, getCompletionRate]);

  const handleToggle = (habitId: string, habitName: string) => {
    const existing = todayLogs.find((l) => l.habitId === habitId);
    const wasCompleted = existing?.completed || false;
    toggleHabitLog(habitId, today);
    if (!wasCompleted) addXP(10, 'habit', `Completed habit: ${habitName}`);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit({ name, icon, color, frequency, targetCount });
    setName(''); setIcon('🎯'); setColor(subjectColors[0]); setFrequency('daily'); setTargetCount(1);
    setShowModal(false);
  };

  // Heatmap data (last 84 days = 12 weeks)
  const heatmapData = useMemo(() => {
    const days: { date: string; count: number; total: number; pct: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayLogs = logs.filter((l) => l.date === d);
      const completed = dayLogs.filter((l) => l.completed).length;
      const total = activeHabits.length;
      days.push({ date: d, count: completed, total, pct: total > 0 ? (completed / total) * 100 : 0 });
    }
    return days;
  }, [logs, activeHabits]);

  // Analytics data
  const analyticsData = useMemo(() => {
    return activeHabits.map((h) => ({
      name: h.name,
      rate: getCompletionRate(h.id, 30),
      color: h.color,
    }));
  }, [activeHabits, getCompletionRate]);

  const getHeatColor = (pct: number) => {
    if (pct === 0) return 'bg-slate-800';
    if (pct <= 25) return 'bg-indigo-900';
    if (pct <= 50) return 'bg-indigo-700';
    if (pct <= 75) return 'bg-indigo-500';
    return 'bg-indigo-400';
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-3xl font-bold gradient-text flex items-center gap-2">
            <Repeat className="w-5 h-5 md:w-7 md:h-7 text-indigo-400" /> Habit Tracker
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5">Build consistency, break barriers</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 rounded-xl gradient-primary text-white text-xs md:text-sm font-medium hover:opacity-90 transition-all hover:scale-105">
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Active Habits', value: activeHabits.length, icon: <Repeat className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-indigo-400', glow: 'stat-glow-indigo' },
          { label: 'Done Today', value: `${completedToday}/${activeHabits.length}`, icon: <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-emerald-400', glow: 'stat-glow-emerald' },
          { label: 'Best Streak', value: `${bestStreak}d`, icon: <Award className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-amber-400', glow: 'stat-glow-amber' },
          { label: 'Avg Rate (30d)', value: `${avgRate}%`, icon: <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-violet-400', glow: 'stat-glow-violet' },
        ].map((stat, i) => (
          <div key={i} className={cn('glass-card p-3 md:p-4 animate-slide-in-up', stat.glow)} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={cn('mb-1.5', stat.color)}>{stat.icon}</div>
            <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] md:text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Habits */}
      {activeHabits.length === 0 ? (
        <div className="glass-card p-8 text-center mb-5">
          <Repeat className="w-10 h-10 mx-auto text-indigo-400/50 mb-3" />
          <h3 className="text-base font-semibold text-gray-300">No habits yet</h3>
          <p className="text-xs text-gray-500 mt-1">Start building your routine!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
          {activeHabits.map((habit, idx) => {
            const isCompleted = todayLogs.find((l) => l.habitId === habit.id)?.completed || false;
            const streak = habitStreaks[habit.id] || { current: 0, longest: 0 };
            const rate = getCompletionRate(habit.id, 30);
            return (
              <div key={habit.id}
                className={cn('glass-card p-3 flex items-center gap-3 animate-slide-in-up transition-all', isCompleted && 'ring-1 ring-emerald-500/30')}
                style={{ animationDelay: `${idx * 60}ms`, borderLeft: `3px solid ${habit.color}` }}>
                <button onClick={() => handleToggle(habit.id, habit.name)}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all shrink-0',
                    isCompleted ? 'bg-emerald-500/20 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                  )}>
                  {isCompleted ? '✅' : habit.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('text-sm font-medium truncate', isCompleted && 'text-emerald-400')}>{habit.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{streak.current}d</span>
                    <span>{rate}% rate</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-500">Best</p>
                  <p className="text-xs font-semibold text-amber-400">{streak.longest}d</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Heatmap */}
      {activeHabits.length > 0 && (
        <div className="glass-card p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Activity Heatmap (12 weeks)
          </h3>
          <div className="flex gap-1 flex-wrap">
            {heatmapData.map((day, i) => (
              <div key={i} className={cn('w-3.5 h-3.5 rounded-sm heatmap-cell cursor-default', getHeatColor(day.pct))}
                title={`${format(new Date(day.date), 'MMM d')}: ${day.count}/${day.total} habits`} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Less</span>
            {['bg-slate-800', 'bg-indigo-900', 'bg-indigo-700', 'bg-indigo-500', 'bg-indigo-400'].map((c) => (
              <div key={c} className={cn('w-3 h-3 rounded-sm', c)} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}

      {/* Analytics Chart */}
      {analyticsData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">30-Day Completion Rate per Habit</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }}
                formatter={(value: any) => [`${value}%`, 'Rate']} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                {analyticsData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Habit">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Habit Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500"
              placeholder="e.g., Exercise, Read, Meditate..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {emojiOptions.map((e) => (
                <button key={e} onClick={() => setIcon(e)}
                  className={cn('w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all',
                    icon === e ? 'bg-indigo-500/30 ring-2 ring-indigo-500 scale-110' : 'bg-slate-800 hover:bg-slate-700')}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {subjectColors.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('w-8 h-8 rounded-full transition-all', color === c && 'ring-2 ring-white scale-110')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as HabitFrequency[]).map((f) => (
                <button key={f} onClick={() => setFrequency(f)}
                  className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                    frequency === f ? 'gradient-primary text-white' : 'bg-slate-800 text-gray-400 hover:bg-slate-700')}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleAdd}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all">
            Create Habit
          </button>
        </div>
      </Modal>
    </div>
  );
}
