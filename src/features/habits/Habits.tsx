import { useState, useMemo } from 'react';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { subjectColors } from '@/data/constants.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { getDateKey, calculateStreak, cn } from '@/utils/helpers.ts';
import { format, subDays } from 'date-fns';
import { Repeat, Plus, Flame, TrendingUp, Award, CheckCircle, BarChart3, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HabitFrequency } from '@/types/index.ts';

const emojiOptions = ['🌅', '🏋️', '💧', '🧘', '📖', '💻', '📵', '📝', '🏃', '🍎', '💪', '🎯', '🧠', '✍️', '😴', '🚀'];

export function Habits() {
  const { habits, logs, addHabit, toggleHabitLog, getCompletionRate } = useHabitStore();
  const addXP = useGameStore((s) => s.addXP);
  const [showModal, setShowModal] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
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

  const getPlantEmoji = (streak: number, isCompleted: boolean) => {
    if (isCompleted) {
      // If completed, the streak is active.
      const activeStreak = streak > 0 ? streak : 1;
      if (activeStreak <= 2) return '🌿'; // Sprout
      if (activeStreak <= 6) return '🪴'; // Potted Plant
      if (activeStreak <= 14) return '🌳'; // Deciduous Tree
      return '🌲'; // Ancient Evergreen
    } else {
      // Not completed today
      if (streak === 0) return '🥀'; // Wilted/missed
      if (streak <= 2) return '🌿';
      if (streak <= 6) return '🪴';
      if (streak <= 14) return '🌳';
      return '🌲';
    }
  };

  const getPlantStageName = (streak: number, isCompleted: boolean) => {
    if (!isCompleted && streak === 0) return 'Wilted';
    if (streak <= 0) return 'Seedling';
    if (streak <= 2) return 'Sprout';
    if (streak <= 6) return 'Potted';
    if (streak <= 14) return 'Deciduous';
    return 'Evergreen';
  };

  const handleToggle = (habitId: string, habitName: string) => {
    const existing = todayLogs.find((l) => l.habitId === habitId);
    const wasCompleted = existing?.completed || false;
    
    setAnimatingId(habitId);
    toggleHabitLog(habitId, today);
    
    if (!wasCompleted) {
      addXP(10, 'habit', `Completed habit: ${habitName}`);
    }

    setTimeout(() => {
      setAnimatingId(null);
    }, 300);
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
    if (pct === 0) return 'bg-white/5';
    if (pct <= 25) return 'bg-violet-950/40';
    if (pct <= 50) return 'bg-violet-800/40';
    if (pct <= 75) return 'bg-violet-600/60';
    return 'bg-violet-500';
  };

  return (
    <div className="animate-fade-in space-y-8" style={{ paddingBottom: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-white font-extrabold flex items-center gap-2">
            <Repeat className="w-5 h-5 text-violet-400" /> Habits
          </h1>
          <p className="text-secondary-text text-gray-400 mt-1">Nurture consistency and grow your daily garden</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-secondary-text font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          style={{ boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)' }}>
          <Plus className="w-4 h-4" /> New Plant
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Plants', value: activeHabits.length, icon: <Repeat className="w-4 h-4" />, color: 'text-violet-400' },
          { label: 'Nurtured Today', value: `${completedToday}/${activeHabits.length}`, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400' },
          { label: 'Max Streak', value: `${bestStreak}d`, icon: <Award className="w-4 h-4" />, color: 'text-amber-400' },
          { label: 'Consistency', value: `${avgRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 flex flex-col justify-between" style={{ minHeight: '90px' }}>
            <div className="flex items-center justify-between">
              <span className="text-label text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="text-page-title text-white font-black mt-2 leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Habit Plants Garden */}
      <div>
        <h2 className="text-section-title text-white font-extrabold mb-4 px-1">Today's Garden</h2>
        {activeHabits.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <span className="text-5xl mb-4">🍂</span>
            <p className="text-card-title text-gray-300 font-semibold">Your garden is empty</p>
            <p className="text-secondary-text text-gray-500 mt-2 max-w-xs">Plant your first habit seedling above and start nurturing your daily rituals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeHabits.map((habit, idx) => {
              const isCompleted = todayLogs.find((l) => l.habitId === habit.id)?.completed || false;
              const streak = habitStreaks[habit.id] || { current: 0, longest: 0 };
              const plantEmoji = getPlantEmoji(streak.current, isCompleted);
              const stageName = getPlantStageName(streak.current, isCompleted);
              const rate = getCompletionRate(habit.id, 30);
              const isAnimating = animatingId === habit.id;

              return (
                <div key={habit.id}
                  className={cn(
                    'glass-card p-5 flex items-center justify-between transition-all duration-300',
                    isCompleted ? 'bg-[#121826]/90 border-emerald-500/20' : 'hover:border-white/10'
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}>
                  
                  {/* Left Column: Habit Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-label uppercase tracking-widest font-extrabold" style={{ color: habit.color || '#8B5CF6' }}>
                        {habit.icon} {habit.frequency}
                      </span>
                    </div>
                    <h3 className={cn(
                      'text-card-title font-extrabold mt-1.5 truncate transition-all duration-200',
                      isCompleted ? 'text-emerald-400 line-through opacity-80' : 'text-white'
                    )}>
                      {habit.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-secondary-text text-gray-400 mt-3">
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        {streak.current}d streak
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <span className="font-semibold text-gray-400">{rate}% consistency</span>
                    </div>
                  </div>

                  {/* Right Column: Plant Interactive Button */}
                  <button onClick={() => handleToggle(habit.id, habit.name)}
                    className={cn(
                      'relative w-18 h-18 rounded-[20px] flex flex-col items-center justify-center transition-all select-none',
                      isCompleted ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/5 hover:bg-white/10',
                      isAnimating && 'animate-bubble-grow'
                    )}
                    style={{ minWidth: '72px' }}>
                    <span className={cn('text-3xl filter transition-transform duration-300', isCompleted ? 'scale-110 drop-shadow-md' : 'grayscale-[20%] opacity-80')}>
                      {plantEmoji}
                    </span>
                    <span className={cn(
                      'text-[9px] uppercase tracking-wider font-extrabold mt-1.5 leading-none transition-colors duration-300',
                      isCompleted ? 'text-emerald-400' : 'text-gray-500'
                    )}>
                      {stageName}
                    </span>
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Heatmap Section */}
      {activeHabits.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-card-title text-white font-extrabold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Consistent Efforts (84-Day Grid)
          </h3>
          <div className="flex gap-1 flex-wrap justify-between md:justify-start">
            {heatmapData.map((day, i) => (
              <div key={i} className={cn('w-3 h-3 rounded-sm heatmap-cell cursor-default transition-all duration-300', getHeatColor(day.pct))}
                title={`${format(new Date(day.date), 'MMM d')}: ${day.count}/${day.total} habits`} />
            ))}
          </div>
          <div className="flex items-center justify-between md:justify-start gap-4 mt-4 text-label text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {['bg-white/5', 'bg-violet-950/40', 'bg-violet-800/40', 'bg-violet-600/60', 'bg-violet-500'].map((c) => (
                <div key={c} className={cn('w-2.5 h-2.5 rounded-sm', c)} />
              ))}
              <span>More</span>
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase">Total Completion: {completedToday} done today</span>
          </div>
        </div>
      )}

      {/* Analytics Chart */}
      {analyticsData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-card-title text-white font-extrabold mb-5">Weekly Growth Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analyticsData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: '600' }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.01)' }} contentStyle={{ background: '#121826', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, color: '#e2e8f0' }}
                formatter={(value: any) => [`${value}%`, 'Consistency']} />
              <Bar dataKey="rate" radius={[0, 12, 12, 0]} barSize={12}>
                {analyticsData.map((entry, i) => (
                  <Cell key={i} fill={entry.color || '#8B5CF6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nurture New Habit">
        <div className="space-y-5">
          <div>
            <label className="block text-label font-bold text-gray-400 uppercase tracking-wider mb-2">Habit Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="e.g. Morning Workout, Code, Read..." />
          </div>
          
          <div>
            <label className="block text-label font-bold text-gray-400 uppercase tracking-wider mb-2">Ritual Icon</label>
            <div className="flex gap-2.5 flex-wrap">
              {emojiOptions.map((e) => (
                <button key={e} onClick={() => setIcon(e)}
                  className={cn('w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all',
                    icon === e ? 'bg-violet-600/20 ring-2 ring-violet-500 scale-110' : 'bg-white/5 hover:bg-white/10'
                  )}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-label font-bold text-gray-400 uppercase tracking-wider mb-2">Theme Color</label>
            <div className="flex gap-3 flex-wrap">
              {subjectColors.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-white scale-115' : 'opacity-80 hover:opacity-100')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-label font-bold text-gray-400 uppercase tracking-wider mb-2">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as HabitFrequency[]).map((f) => (
                <button key={f} onClick={() => setFrequency(f)}
                  className={cn('px-4 py-2.5 rounded-2xl text-secondary-text font-bold transition-all capitalize flex-1',
                    frequency === f ? 'bg-violet-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <button onClick={handleAdd}
            className="w-full py-3.5 rounded-2xl bg-violet-600 text-white text-secondary-text font-bold hover:bg-violet-500 transition-all shadow-xl"
            style={{ boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)' }}>
            Plant Seedling
          </button>
        </div>
      </Modal>

    </div>
  );
}
