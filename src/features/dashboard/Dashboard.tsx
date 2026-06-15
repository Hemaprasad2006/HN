import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useHabitStore } from '@/stores/useHabitStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { getGreeting, getDateKey, formatDuration, percentage, cn } from '@/utils/helpers.ts';
import { CheckCircle2, Circle, Play, Sparkles, Flame, CheckSquare, Target } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = getDateKey(today);

  const profile = useSettingsStore((s) => s.profile);
  const tasks = usePlannerStore((s) => s.tasks);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const habits = useHabitStore((s) => s.habits);
  const getLogsForDate = useHabitStore((s) => s.getLogsForDate);
  const getTotalHours = useStudyStore((s) => s.getTotalHours);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const totalXP = useGameStore((s) => s.totalXP);
  const getTodayFocusMinutes = useFocusStore((s) => s.getTodayFocusMinutes);

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayKey), [tasks, todayKey]);
  const completedTasks = todayTasks.filter((t) => t.status === 'done').length;
  const todayHabitLogs = useMemo(() => getLogsForDate(todayKey), [getLogsForDate, todayKey]);
  const completedHabits = todayHabitLogs.filter((l) => l.completed).length;
  const weekStudyHours = useMemo(() => getTotalHours(7), [getTotalHours]);
  const todayFocusMin = useMemo(() => getTodayFocusMinutes(), [getTodayFocusMinutes]);
  const todayHealth = healthLogs.find((l) => l.date === todayKey);
  const waterIntake = todayHealth?.waterIntake || 0;
  const waterPct = Math.min(100, Math.round((waterIntake / (profile.targetWater || 3000)) * 100));

  const lifeScore = useMemo(() => {
    const taskScore = todayTasks.length > 0 ? (completedTasks / todayTasks.length) * 25 : 25;
    const habitScore = habits.length > 0 ? (completedHabits / habits.length) * 25 : 25;
    const waterScore = waterPct * 0.25;
    const focusScore = Math.min(25, (todayFocusMin / 120) * 25);
    return Math.round(taskScore + habitScore + waterScore + focusScore);
  }, [completedTasks, todayTasks.length, completedHabits, habits.length, waterPct, todayFocusMin]);

  const greeting = getGreeting();

  // Top 3 tasks
  const top3Tasks = useMemo(() => {
    return [...todayTasks]
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        const pOrder = { high: 0, medium: 1, low: 2 };
        return pOrder[a.priority] - pOrder[b.priority];
      })
      .slice(0, 3);
  }, [todayTasks]);

  // Today's main mission
  const mainMission = useMemo(() => {
    return todayTasks.find((t) => t.status !== 'done' && t.priority === 'high') || 
           todayTasks.find((t) => t.status !== 'done') || 
           null;
  }, [todayTasks]);

  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (lifeScore / 100) * circ;

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ paddingBottom: '24px' }}>
      
      {/* 1. Greeting Section */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-label text-gray-400 uppercase tracking-wider">{format(today, 'EEEE, MMM d')}</p>
          <h1 className="text-page-title text-white font-extrabold mt-1">{greeting}, {profile.name?.split(' ')[0] || 'Hemaprasad'}</h1>
        </div>
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg width="60" height="60" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="8" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#8B5CF6" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dashOffset} className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-label font-black text-white leading-none">{lifeScore}</span>
            <span style={{ fontSize: '7px' }} className="text-gray-400 font-bold mt-0.5">SCORE</span>
          </div>
        </div>
      </div>

      {/* 2. Today's Mission Card */}
      {mainMission ? (
        <div className="glass-card p-4 flex flex-col gap-4 border border-[#8B5CF6]/20 bg-gradient-to-br from-[#141B2D] to-[#1E293B]">
          <div className="flex items-center justify-between">
            <span className="text-label text-[#8B5CF6] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Primary Mission
            </span>
            <span className="text-label text-gray-400 bg-white/5 px-2 py-0.5 rounded-full font-bold">
              {mainMission.priority}
            </span>
          </div>
          <div>
            <h3 className="text-card-title text-white font-bold">{mainMission.title}</h3>
            {mainMission.description && (
              <p className="text-secondary-text text-gray-400 mt-1 line-clamp-1">{mainMission.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between text-label">
            <span className="text-gray-400">Time estimate: {formatDuration(mainMission.estimatedMinutes)}</span>
            <button onClick={() => toggleTask(mainMission.id)} className="text-[#8B5CF6] font-bold active:scale-95 transition-transform">
              Complete Mission →
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center bg-[#141B2D]">
          <span className="text-2xl">🏆</span>
          <h3 className="text-card-title text-white font-bold mt-2">All Clear!</h3>
          <p className="text-secondary-text text-gray-400 mt-1">No pending primary missions. Add a task to begin.</p>
        </div>
      )}

      {/* 3. Top 3 Tasks */}
      <div>
        <div className="text-label text-gray-400 uppercase tracking-wider mb-3 px-1 flex justify-between items-center">
          <span>Focus Checklist</span>
          {todayTasks.length > 3 && (
            <button onClick={() => navigate('/planner')} className="text-[#8B5CF6] font-bold normal-case">
              See all ({todayTasks.length})
            </button>
          )}
        </div>
        
        {top3Tasks.length === 0 ? (
          <div className="glass-card p-4 text-center bg-[#141B2D]">
            <p className="text-secondary-text text-gray-400">Checklist is empty. Add tasks to start today's timeline.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {top3Tasks.map((task) => {
              const done = task.status === 'done';
              return (
                <button key={task.id} onClick={() => toggleTask(task.id)}
                  className={cn(
                    'w-full glass-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99]',
                    task.priority === 'high' ? 'border-l-2 border-l-[#EF4444]' : 
                    task.priority === 'medium' ? 'border-l-2 border-l-[#F59E0B]' : 'border-l-2 border-l-[#22C55E]'
                  )}>
                  <div className="shrink-0 transition-transform active:scale-90">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] animate-check" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500 hover:text-[#8B5CF6]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-body font-semibold truncate', done && 'line-through text-gray-500')}>{task.title}</p>
                    {task.estimatedMinutes > 0 && !done && (
                      <p className="text-label text-gray-400 mt-0.5">{formatDuration(task.estimatedMinutes)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Focus Session Shortcut */}
      <button onClick={() => navigate('/focus')}
        className="w-full glass-card p-4 flex items-center justify-between bg-gradient-to-r from-[#8B5CF6]/10 to-transparent border border-[#8B5CF6]/20 active:scale-[0.99] transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div className="text-left">
            <h4 className="text-card-title text-white font-bold leading-tight">Start Focus Session</h4>
            <p className="text-label text-gray-400 mt-0.5">Activate immersive study timer</p>
          </div>
        </div>
        <span className="text-secondary-text text-gray-400 font-bold px-2">Go →</span>
      </button>

      {/* 5. AI Recommendation */}
      <div className="glass-card p-4 bg-[#141B2D] flex items-start gap-3 border border-white/5">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-[#8B5CF6] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-label text-gray-400 font-bold uppercase tracking-wider">Growth Recommendation</p>
          <p className="text-secondary-text text-gray-300 mt-1 leading-relaxed">
            {lifeScore >= 75
              ? `Outstanding momentum, ${profile.name || 'Hemaprasad'}. Let's push for 100% daily alignment today.`
              : completedTasks === 0 && todayTasks.length > 0
              ? `Check off your first task to jump-start your daily productivity score.`
              : `Completing your study targets today will add 20+ XP to your rank.`}
          </p>
        </div>
      </div>

      {/* 6. Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Tasks', value: `${completedTasks}/${todayTasks.length}`, icon: CheckSquare, color: '#8B5CF6' },
          { label: 'Streak', value: `${completedHabits}🔥`, icon: Flame, color: '#F59E0B' },
          { label: 'Focus', value: todayFocusMin > 0 ? `${todayFocusMin}m` : '0m', icon: Play, color: '#22C55E' },
          { label: 'XP', value: `${totalXP}`, icon: Target, color: '#8B5CF6' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-3 flex flex-col gap-1 items-center justify-center text-center bg-[#141B2D]">
            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            <span className="text-body font-black text-white mt-1 leading-tight">{stat.value}</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
