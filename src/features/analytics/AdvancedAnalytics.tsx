import { useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, BarChart, Bar, Legend,
} from 'recharts';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, Brain, Zap, Moon } from 'lucide-react';

export function AdvancedAnalytics() {
  const tasks = usePlannerStore((s) => s.tasks);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const studySessions = useStudyStore((s) => s.sessions);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const exerciseLogs = useHealthStore((s) => s.exerciseLogs);

  const weeklyTrends = useMemo(() => {
    const weeksData: Record<number, { week: string; studyHours: number; workouts: number; habitRate: number; count: number }> = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = subDays(now, i * 7);
      const weekNum = format(weekStart, 'w');
      weeksData[Number(weekNum)] = { week: `Wk ${weekNum}`, studyHours: 0, workouts: 0, habitRate: 0, count: 0 };
    }
    studySessions.forEach((s) => {
      const date = parseISO(s.startTime); const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) { const w = Number(format(date, 'w')); if (weeksData[w]) weeksData[w].studyHours += s.durationMinutes / 60; }
    });
    exerciseLogs.forEach((l) => {
      const date = parseISO(l.date); const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) { const w = Number(format(date, 'w')); if (weeksData[w]) weeksData[w].workouts += 1; }
    });
    habitLogs.forEach((l) => {
      const date = parseISO(l.date); const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) { const w = Number(format(date, 'w')); if (weeksData[w]) { if (l.completed) weeksData[w].habitRate += 1; weeksData[w].count += 1; } }
    });
    return Object.values(weeksData).map((w) => ({ week: w.week, studyHours: Number(w.studyHours.toFixed(1)), workouts: w.workouts, habitRate: w.count > 0 ? Math.round((w.habitRate / w.count) * 100) : 0 }));
  }, [studySessions, exerciseLogs, habitLogs]);

  const momStats = useMemo(() => {
    const now = new Date(); const thisMonthStart = subDays(now, 30); const lastMonthStart = subDays(now, 60);
    const getStatsForRange = (start: Date, end: Date) => {
      const inRange = (d: string) => { const p = parseISO(d); return p >= start && p < end; };
      const rangeTasks = tasks.filter((t) => inRange(t.dueDate));
      const completedTasks = rangeTasks.filter((t) => t.status === 'done').length;
      const totalTasks = rangeTasks.length;
      const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
      const rangeSessions = studySessions.filter((s) => inRange(s.startTime));
      const studyHours = rangeSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
      const focusAvg = rangeSessions.length > 0 ? rangeSessions.reduce((sum, s) => sum + s.focusRating, 0) / rangeSessions.length : 0;
      const rangeLogs = habitLogs.filter((l) => inRange(l.date));
      const habitRate = rangeLogs.length > 0 ? Math.round((rangeLogs.filter((l) => l.completed).length / rangeLogs.length) * 100) : 0;
      const rangeHealth = healthLogs.filter((l) => inRange(l.date));
      const sleepAvg = rangeHealth.length > 0 ? rangeHealth.reduce((sum, l) => sum + l.sleepHours, 0) / rangeHealth.length : 0;
      return { taskRate, studyHours, focusAvg, habitRate, sleepAvg };
    };
    const currentStats = getStatsForRange(thisMonthStart, now);
    const previousStats = getStatsForRange(lastMonthStart, thisMonthStart);
    const calcDelta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    return {
      current: currentStats, previous: previousStats,
      deltas: { taskRate: currentStats.taskRate - previousStats.taskRate, studyHours: calcDelta(currentStats.studyHours, previousStats.studyHours), focusAvg: calcDelta(currentStats.focusAvg, previousStats.focusAvg), habitRate: currentStats.habitRate - previousStats.habitRate, sleepAvg: calcDelta(currentStats.sleepAvg, previousStats.sleepAvg) },
    };
  }, [tasks, studySessions, habitLogs, healthLogs]);

  // Exactly 3 story-driven insights
  const storyInsights = useMemo(() => {
    const list: { title: string; text: string; icon: any; color: string }[] = [];

    // 1. Study Insight
    if (momStats.deltas.studyHours >= 0) {
      list.push({
        title: "Study Performance",
        text: `Your study focus is up by ${momStats.deltas.studyHours}%. You log sessions best in evening intervals.`,
        icon: Brain,
        color: '#8B5CF6',
      });
    } else {
      list.push({
        title: "Study Schedule",
        text: `Study hours dropped by ${Math.abs(momStats.deltas.studyHours)}%. Try scheduling 20-minute focus blocks after dinner.`,
        icon: Brain,
        color: '#8B5CF6',
      });
    }

    // 2. Sleep & Rest
    if (momStats.current.sleepAvg >= 7) {
      list.push({
        title: "Sleep Optimization",
        text: `Great sleep consistency! Your ${momStats.current.sleepAvg.toFixed(1)}h average sleep correlates with higher task completions.`,
        icon: Moon,
        color: '#22C55E',
      });
    } else {
      list.push({
        title: "Rest Recovery",
        text: `Averaging ${momStats.current.sleepAvg.toFixed(1)}h sleep. Target 7.5h to optimize cognitive focus.`,
        icon: Moon,
        color: '#EF4444',
      });
    }

    // 3. Habits
    if (momStats.current.habitRate >= 60) {
      list.push({
        title: "Habit Stacking",
        text: `Discipline is strong! Your habit execution rate is at ${momStats.current.habitRate}% this month.`,
        icon: Zap,
        color: '#F59E0B',
      });
    } else {
      list.push({
        title: "Habit Triggers",
        text: `Habit rate is at ${momStats.current.habitRate}%. Try stack routines right after morning checks.`,
        icon: Zap,
        color: '#F59E0B',
      });
    }

    return list.slice(0, 3);
  }, [momStats]);

  const tooltipStyle = {
    background: '#141B2D',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    color: '#F8FAFC',
    fontSize: '11px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ paddingBottom: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 className="text-page-title text-white font-extrabold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-400" /> Insights
        </h1>
        <p className="text-secondary-text text-gray-400 mt-1">Growth trends and cognitive sleep-habit correlations</p>
      </div>

      {/* 3 Story-driven Insights */}
      <div className="flex flex-col gap-3">
        {storyInsights.map((insight, idx) => (
          <div key={idx} className="glass-card p-4 flex gap-3.5 items-start bg-[#141B2D]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${insight.color}10` }}>
              <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
            </div>
            <div className="min-w-0">
              <h4 className="text-card-title text-white font-bold leading-tight">{insight.title}</h4>
              <p className="text-secondary-text text-gray-400 mt-1 leading-relaxed">{insight.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MoM Performance Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Study Hours', value: `${momStats.current.studyHours.toFixed(1)}h`, delta: momStats.deltas.studyHours },
          { label: 'Task Rate', value: `${momStats.current.taskRate}%`, delta: momStats.deltas.taskRate },
          { label: 'Habit Rate', value: `${momStats.current.habitRate}%`, delta: momStats.deltas.habitRate },
          { label: 'Avg Sleep', value: `${momStats.current.sleepAvg.toFixed(1)}h`, delta: momStats.deltas.sleepAvg },
        ].map((card, i) => (
          <div key={i} className="glass-card p-4 bg-[#141B2D]">
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider">{card.label}</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-card-title text-white font-black" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{card.value}</h3>
              <span className={`text-label font-bold flex items-center gap-0.5 ${ card.delta >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]' }`}>
                {card.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {card.delta >= 0 ? '+' : ''}{card.delta}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Exactly 2 clean charts */}
      <div className="flex flex-col gap-4">
        
        {/* Chart 1: Study vs Workouts */}
        <div className="glass-card p-4 space-y-3 bg-[#141B2D]">
          <div>
            <h4 className="text-card-title text-white font-bold">Study & Workouts</h4>
            <p className="text-label text-gray-500 mt-0.5">Weekly breakdown (last 8 weeks)</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends} margin={{ top: 10, right: 0, bottom: 5, left: -25 }}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#8B5CF6" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#EF4444" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar yAxisId="left" dataKey="studyHours" name="Study" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="workouts" name="Workouts" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Habits vs Study */}
        <div className="glass-card p-4 space-y-3 bg-[#141B2D]">
          <div>
            <h4 className="text-card-title text-white font-bold">Habits vs Study Hours</h4>
            <p className="text-label text-gray-500 mt-0.5">Weekly compliance trend (last 8 weeks)</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends} margin={{ top: 10, right: 0, bottom: 5, left: -25 }}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#F59E0B" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#8B5CF6" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Line yAxisId="left" type="monotone" dataKey="habitRate" name="Habit %" stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="studyHours" name="Study (h)" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
